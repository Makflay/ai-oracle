-- DropIndex
DROP INDEX "raw_records_source_id_checksum_key";

-- CreateIndex
CREATE INDEX "raw_records_source_id_checksum_idx" ON "raw_records"("source_id", "checksum");
