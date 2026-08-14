-- CreateEnum
CREATE TYPE "forecast_type" AS ENUM ('short_term', 'medium_term', 'long_term');

-- CreateEnum
CREATE TYPE "prediction_direction" AS ENUM ('up', 'down', 'neutral');

-- CreateEnum
CREATE TYPE "risk_level" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "forecast_status" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "metric_type" AS ENUM ('price', 'volume', 'volatility', 'momentum', 'sentiment');

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_records" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "entity_id" UUID,
    "external_id" TEXT,
    "checksum" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "raw_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "raw_record_id" UUID,
    "type" "metric_type" NOT NULL,
    "value" DECIMAL(24,8) NOT NULL,
    "unit" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecasts" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "type" "forecast_type" NOT NULL,
    "status" "forecast_status" NOT NULL DEFAULT 'pending',
    "direction" "prediction_direction",
    "risk_level" "risk_level",
    "confidence" DECIMAL(5,4),
    "predicted_value" DECIMAL(24,8),
    "summary" TEXT,
    "failure_reason" TEXT,
    "model_version" TEXT,
    "target_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_factors" (
    "id" UUID NOT NULL,
    "forecast_id" UUID NOT NULL,
    "metric_id" UUID,
    "metric_type" "metric_type" NOT NULL,
    "direction" "prediction_direction" NOT NULL,
    "weight" DECIMAL(7,6) NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_outcomes" (
    "id" UUID NOT NULL,
    "forecast_id" UUID NOT NULL,
    "actual_direction" "prediction_direction" NOT NULL,
    "actual_value" DECIMAL(24,8),
    "accuracy_score" DECIMAL(5,4),
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sources_key_key" ON "sources"("key");

-- CreateIndex
CREATE INDEX "sources_is_active_idx" ON "sources"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "entities_slug_key" ON "entities"("slug");

-- CreateIndex
CREATE INDEX "entities_symbol_idx" ON "entities"("symbol");

-- CreateIndex
CREATE INDEX "raw_records_source_id_observed_at_idx" ON "raw_records"("source_id", "observed_at");

-- CreateIndex
CREATE INDEX "raw_records_source_id_external_id_idx" ON "raw_records"("source_id", "external_id");

-- CreateIndex
CREATE INDEX "raw_records_entity_id_observed_at_idx" ON "raw_records"("entity_id", "observed_at");

-- CreateIndex
CREATE INDEX "raw_records_ingested_at_idx" ON "raw_records"("ingested_at");

-- CreateIndex
CREATE UNIQUE INDEX "raw_records_source_id_checksum_key" ON "raw_records"("source_id", "checksum");

-- CreateIndex
CREATE INDEX "metrics_entity_id_type_observed_at_idx" ON "metrics"("entity_id", "type", "observed_at" DESC);

-- CreateIndex
CREATE INDEX "metrics_raw_record_id_idx" ON "metrics"("raw_record_id");

-- CreateIndex
CREATE INDEX "metrics_calculated_at_idx" ON "metrics"("calculated_at");

-- CreateIndex
CREATE INDEX "forecasts_entity_id_type_created_at_idx" ON "forecasts"("entity_id", "type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "forecasts_entity_id_target_at_idx" ON "forecasts"("entity_id", "target_at");

-- CreateIndex
CREATE INDEX "forecasts_status_created_at_idx" ON "forecasts"("status", "created_at");

-- CreateIndex
CREATE INDEX "forecasts_target_at_idx" ON "forecasts"("target_at");

-- CreateIndex
CREATE INDEX "forecast_factors_forecast_id_idx" ON "forecast_factors"("forecast_id");

-- CreateIndex
CREATE INDEX "forecast_factors_metric_id_idx" ON "forecast_factors"("metric_id");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_factors_forecast_id_position_key" ON "forecast_factors"("forecast_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_outcomes_forecast_id_key" ON "forecast_outcomes"("forecast_id");

-- CreateIndex
CREATE INDEX "forecast_outcomes_observed_at_idx" ON "forecast_outcomes"("observed_at");

-- AddForeignKey
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_raw_record_id_fkey" FOREIGN KEY ("raw_record_id") REFERENCES "raw_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_factors" ADD CONSTRAINT "forecast_factors_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "forecasts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_factors" ADD CONSTRAINT "forecast_factors_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_outcomes" ADD CONSTRAINT "forecast_outcomes_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "forecasts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
