/*
  Warnings:

  - You are about to drop the column `type` on the `forecasts` table. All the data in the column will be lost.
  - Added the required column `explainability` to the `forecasts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forecastType` to the `forecasts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prediction` to the `forecasts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `risk` to the `forecasts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `forecasts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "forecasts_entity_id_type_created_at_idx";

-- AlterTable
ALTER TABLE "forecasts" DROP COLUMN "type",
ADD COLUMN     "explainability" JSONB NOT NULL,
ADD COLUMN     "forecastType" "forecast_type" NOT NULL,
ADD COLUMN     "prediction" TEXT NOT NULL,
ADD COLUMN     "risk" "risk_level" NOT NULL,
ADD COLUMN     "score" DECIMAL(5,2) NOT NULL;

-- CreateIndex
CREATE INDEX "forecasts_entity_id_forecastType_created_at_idx" ON "forecasts"("entity_id", "forecastType", "created_at" DESC);
