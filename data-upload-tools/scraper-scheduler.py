#!/usr/bin/env python3
"""
Automated Scheduler for Pacific Sands Web Scraping System
Runs scraping tasks on configurable intervals
"""

import asyncio
import schedule
import time
import logging
from datetime import datetime, timedelta
import json
from web_scraping_system import PacificSandsScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/simeong/data-upload-tools/scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScrapingScheduler:
    def __init__(self):
        self.scraper = PacificSandsScraper()
        self.config = self.load_config()
        
    def load_config(self):
        """Load scraping configuration"""
        default_config = {
            "competitor_pricing": {
                "frequency": "daily",
                "time": "06:00",
                "enabled": True
            },
            "mentions_monitoring": {
                "frequency": "hourly",
                "interval": 2,  # Every 2 hours
                "enabled": True
            },
            "reviews_scraping": {
                "frequency": "daily",
                "time": "08:00",
                "enabled": True
            },
            "full_scrape": {
                "frequency": "weekly",
                "day": "sunday",
                "time": "02:00",
                "enabled": True
            },
            "emergency_monitoring": {
                "keywords": ["Pacific Sands crisis", "Pacific Sands problem", "Pacific Sands closed"],
                "frequency": "hourly",
                "interval": 1,
                "enabled": True
            }
        }
        
        try:
            with open('/Users/simeong/data-upload-tools/scraper-config.json', 'r') as f:
                config = json.load(f)
                # Merge with defaults for any missing keys
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
        except FileNotFoundError:
            # Save default config
            with open('/Users/simeong/data-upload-tools/scraper-config.json', 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config

    async def run_competitor_pricing_job(self):
        """Scheduled job for competitor pricing"""
        logger.info("Starting scheduled competitor pricing scrape")
        try:
            await self.scraper.init_session()
            rates = await self.scraper.run_competitor_pricing_scrape()
            if rates:
                await self.scraper.save_data_to_mcp(rates, [], [])
                self.scraper.save_to_csv(rates, [], [])
            await self.scraper.close_session()
            logger.info(f"Competitor pricing job completed: {len(rates)} rates collected")
        except Exception as e:
            logger.error(f"Error in competitor pricing job: {e}")

    async def run_mentions_monitoring_job(self):
        """Scheduled job for mentions monitoring"""
        logger.info("Starting scheduled mentions monitoring")
        try:
            await self.scraper.init_session()
            mentions = await self.scraper.run_mentions_monitoring()
            if mentions:
                await self.scraper.save_data_to_mcp([], mentions, [])
                self.scraper.save_to_csv([], mentions, [])
            await self.scraper.close_session()
            logger.info(f"Mentions monitoring job completed: {len(mentions)} mentions found")
        except Exception as e:
            logger.error(f"Error in mentions monitoring job: {e}")

    async def run_reviews_scraping_job(self):
        """Scheduled job for reviews scraping"""
        logger.info("Starting scheduled reviews scraping")
        try:
            await self.scraper.init_session()
            reviews = await self.scraper.run_reviews_scrape()
            if reviews:
                await self.scraper.save_data_to_mcp([], [], reviews)
                self.scraper.save_to_csv([], [], reviews)
            await self.scraper.close_session()
            logger.info(f"Reviews scraping job completed: {len(reviews)} reviews collected")
        except Exception as e:
            logger.error(f"Error in reviews scraping job: {e}")

    async def run_full_scrape_job(self):
        """Scheduled job for comprehensive scraping"""
        logger.info("Starting scheduled full scrape")
        try:
            await self.scraper.run_full_scrape()
            logger.info("Full scrape job completed successfully")
        except Exception as e:
            logger.error(f"Error in full scrape job: {e}")

    async def run_emergency_monitoring_job(self):
        """Monitor for crisis-related mentions"""
        logger.info("Running emergency monitoring")
        try:
            await self.scraper.init_session()
            emergency_mentions = []
            
            for keyword in self.config["emergency_monitoring"]["keywords"]:
                mentions = await self.scraper.scrape_google_mentions(keyword)
                emergency_mentions.extend(mentions)
                
            if emergency_mentions:
                # Mark as high priority
                for mention in emergency_mentions:
                    mention.platform = "EMERGENCY_ALERT"
                    
                await self.scraper.save_data_to_mcp([], emergency_mentions, [])
                logger.warning(f"EMERGENCY: {len(emergency_mentions)} crisis mentions found!")
                
            await self.scraper.close_session()
        except Exception as e:
            logger.error(f"Error in emergency monitoring: {e}")

    def schedule_jobs(self):
        """Set up all scheduled jobs based on configuration"""
        config = self.config
        
        # Competitor pricing
        if config["competitor_pricing"]["enabled"]:
            if config["competitor_pricing"]["frequency"] == "daily":
                schedule.every().day.at(config["competitor_pricing"]["time"]).do(
                    lambda: asyncio.run(self.run_competitor_pricing_job())
                )
            elif config["competitor_pricing"]["frequency"] == "hourly":
                schedule.every().hour.do(
                    lambda: asyncio.run(self.run_competitor_pricing_job())
                )

        # Mentions monitoring
        if config["mentions_monitoring"]["enabled"]:
            if config["mentions_monitoring"]["frequency"] == "hourly":
                interval = config["mentions_monitoring"]["interval"]
                schedule.every(interval).hours.do(
                    lambda: asyncio.run(self.run_mentions_monitoring_job())
                )

        # Reviews scraping
        if config["reviews_scraping"]["enabled"]:
            if config["reviews_scraping"]["frequency"] == "daily":
                schedule.every().day.at(config["reviews_scraping"]["time"]).do(
                    lambda: asyncio.run(self.run_reviews_scraping_job())
                )

        # Full scrape
        if config["full_scrape"]["enabled"]:
            if config["full_scrape"]["frequency"] == "weekly":
                day = config["full_scrape"]["day"]
                time_str = config["full_scrape"]["time"]
                
                getattr(schedule.every(), day).at(time_str).do(
                    lambda: asyncio.run(self.run_full_scrape_job())
                )

        # Emergency monitoring
        if config["emergency_monitoring"]["enabled"]:
            interval = config["emergency_monitoring"]["interval"]
            schedule.every(interval).hours.do(
                lambda: asyncio.run(self.run_emergency_monitoring_job())
            )

        logger.info("All scraping jobs scheduled successfully")

    def run_scheduler(self):
        """Main scheduler loop"""
        logger.info("Starting Pacific Sands Web Scraping Scheduler")
        self.schedule_jobs()
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying

    def run_manual_job(self, job_type: str):
        """Run a specific job manually"""
        logger.info(f"Running manual job: {job_type}")
        
        job_map = {
            "pricing": self.run_competitor_pricing_job,
            "mentions": self.run_mentions_monitoring_job,
            "reviews": self.run_reviews_scraping_job,
            "full": self.run_full_scrape_job,
            "emergency": self.run_emergency_monitoring_job
        }
        
        if job_type in job_map:
            asyncio.run(job_map[job_type]())
        else:
            logger.error(f"Unknown job type: {job_type}")

if __name__ == "__main__":
    import sys
    
    scheduler = ScrapingScheduler()
    
    if len(sys.argv) > 1:
        # Manual job execution
        job_type = sys.argv[1]
        scheduler.run_manual_job(job_type)
    else:
        # Start automatic scheduler
        scheduler.run_scheduler()