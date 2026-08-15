/*
  Warnings:

  - Added the required column `normalized_value` to the `forecast_factors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raw_value` to the `forecast_factors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_key` to the `forecast_factors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forecast_factors" ADD COLUMN     "normalized_value" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "raw_value" DECIMAL(24,8) NOT NULL,
ADD COLUMN     "source_key" TEXT NOT NULL,
ALTER COLUMN "direction" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "forecast_factors_source_key_metric_type_idx" ON "forecast_factors"("source_key", "metric_type");
