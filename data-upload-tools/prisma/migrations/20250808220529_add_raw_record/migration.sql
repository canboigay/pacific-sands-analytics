-- CreateTable
CREATE TABLE "raw_records" (
    "id" SERIAL NOT NULL,
    "data_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "embedding" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_records_payload_idx" ON "raw_records" USING GIN ("payload");

