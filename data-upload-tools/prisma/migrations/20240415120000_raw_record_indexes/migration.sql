-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create GIN index on RawRecord.payload for efficient key-based queries
CREATE INDEX IF NOT EXISTS raw_record_payload_gin_idx
  ON "RawRecord"
  USING GIN (payload jsonb_path_ops);

-- Create ivfflat index on RawRecord.embedding for fast vector similarity search
CREATE INDEX IF NOT EXISTS raw_record_embedding_ivfflat_idx
  ON "RawRecord"
  USING ivfflat (embedding vector_l2_ops)
  WITH (lists = 100);
