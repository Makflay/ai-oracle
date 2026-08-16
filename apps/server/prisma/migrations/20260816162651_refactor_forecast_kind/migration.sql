/*
  Warnings:

  - Added the required column `forecast_kind` to the `forecasts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "forecasts_entity_id_forecastType_created_at_idx";

-- AlterTable
ALTER TABLE "forecasts" ADD COLUMN     "forecast_kind" "forecast_kind" NOT NULL;

-- CreateIndex
CREATE INDEX "forecasts_entity_id_forecast_kind_forecastType_created_at_idx" ON "forecasts"("entity_id", "forecast_kind", "forecastType", "created_at" DESC);
