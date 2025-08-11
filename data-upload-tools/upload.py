#!/usr/bin/env python3
"""
Unified data upload tool for Pacific Sands Analytics.

Combines features from previous scripts:
- bulk-upload-script.js
- upload_all_pacific_sands_data.py
- upload_ps_data.py

Supports uploading a single file or all CSV/Excel files in a directory,
automatically detecting data type (rates, competitors, feedback) and
sending the data to the upload API in configurable batches.
"""
import argparse
import glob
import os
from datetime import datetime

import pandas as pd
import requests

DEFAULT_API_URL = "http://localhost:3000/api/upload"
DEFAULT_API_KEY = "ps_me2w0k3e_x81fsv0yz3k"


def find_files(path: str):
    """Return list of CSV/Excel files from a path."""
    if os.path.isfile(path):
        return [path] if path.lower().endswith((".csv", ".xlsx", ".xls")) else []

    files = []
    for pattern in ("**/*.csv", "**/*.xlsx", "**/*.xls"):
        files.extend(glob.glob(os.path.join(path, pattern), recursive=True))
    return files


def detect_data_type(df: pd.DataFrame, filename: str) -> str:
    """Detect dataset type from filename/columns."""
    columns = [str(c).lower() for c in df.columns]
    fname = filename.lower()

    if "competitor" in fname or any("competitor" in c for c in columns):
        return "competitors"
    if "review" in fname or "feedback" in fname or any(
        ("review" in c or "rating" in c or "feedback" in c) for c in columns
    ):
        return "feedback"
    return "rates"


def process_rates(df: pd.DataFrame):
    records = []
    for _, row in df.iterrows():
        try:
            date = row.get("date") or row.get("Date") or row.get("Stay Date") or datetime.now().isoformat()
            rate = (
                row.get("rate")
                or row.get("Rate")
                or row.get("price")
                or row.get("ADR")
                or row.get("Daily Rate")
            )
            if pd.isna(rate):
                continue
            room = (
                row.get("room_type")
                or row.get("RoomType")
                or row.get("Room Type")
                or "Standard"
            )
            occ = row.get("occupancy") or row.get("Occupancy") or row.get("occupancy_rate")
            if pd.notna(occ):
                occ = float(occ if float(occ) <= 1 else float(occ) / 100)
            else:
                occ = 0.75
            records.append(
                {
                    "date": str(date),
                    "rate": float(rate),
                    "room_type": str(room),
                    "occupancy": float(occ),
                }
            )
        except Exception:
            continue
    return records


def process_competitors(df: pd.DataFrame):
    records = []
    for _, row in df.iterrows():
        try:
            comp = (
                row.get("competitor")
                or row.get("Competitor")
                or row.get("competitor_name")
                or row.get("name")
                or "Unknown"
            )
            date = row.get("date") or row.get("Date") or datetime.now().isoformat()
            rate = row.get("rate") or row.get("Rate") or row.get("price")
            if pd.isna(rate):
                continue
            room = row.get("room_type") or row.get("Room Type") or "Standard"
            records.append(
                {
                    "competitor": str(comp),
                    "date": str(date),
                    "rate": float(rate),
                    "room_type": str(room),
                }
            )
        except Exception:
            continue
    return records


def process_feedback(df: pd.DataFrame):
    records = []
    for _, row in df.iterrows():
        try:
            date = row.get("date") or row.get("Date") or datetime.now().isoformat()
            rating = row.get("rating") or row.get("Rating")
            if pd.isna(rating):
                continue
            comment = row.get("comment") or row.get("review") or ""
            category = row.get("category") or "General"
            records.append(
                {
                    "date": str(date),
                    "rating": float(rating),
                    "comment": str(comment),
                    "category": str(category),
                }
            )
        except Exception:
            continue
    return records


PROCESSORS = {
    "rates": process_rates,
    "competitors": process_competitors,
    "feedback": process_feedback,
}


def upload(api_url, api_key, data_type, data, filename, batch_size=100):
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    for i in range(0, len(data), batch_size):
        batch = data[i : i + batch_size]
        payload = {"data_type": data_type, "data": batch, "filename": filename}
        r = requests.post(api_url, json=payload, headers=headers, timeout=30)
        if not r.ok:
            raise Exception(f"HTTP {r.status_code}: {r.text}")


def main():
    parser = argparse.ArgumentParser(
        description="Upload CSV/Excel data to Pacific Sands Analytics"
    )
    parser.add_argument("path", help="Path to data file or directory")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Upload API endpoint")
    parser.add_argument("--api-key", default=DEFAULT_API_KEY, help="API key for authentication")
    parser.add_argument("--batch-size", type=int, default=100, help="Records per upload batch")
    parser.add_argument("--dry-run", action="store_true", help="Process files without uploading")
    args = parser.parse_args()

    files = find_files(args.path)
    if not files:
        print("No data files found")
        return

    print(f"Found {len(files)} file(s)")
    for file_path in files:
        filename = os.path.basename(file_path)
        print(f"\nProcessing {filename}...")
        try:
            if file_path.lower().endswith(".csv"):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
        except Exception as e:
            print(f"  Could not read file: {e}")
            continue

        data_type = detect_data_type(df, filename)
        records = PROCESSORS[data_type](df)
        if not records:
            print("  No valid records found, skipping")
            continue

        print(f"  Detected type: {data_type} | Records: {len(records)}")
        if args.dry_run:
            continue
        try:
            upload(args.api_url, args.api_key, data_type, records, filename, args.batch_size)
            print("  ✅ Upload successful")
        except Exception as e:
            print(f"  ❌ Upload failed: {e}")


if __name__ == "__main__":
    main()

