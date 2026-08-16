/*
  Warnings:

  - You are about to drop the column `accuracy_score` on the `forecast_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `actual_direction` on the `forecast_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `observed_at` on the `forecast_outcomes` table. All the data in the column will be lost.
  - Added the required column `evaluated_at` to the `forecast_outcomes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expected_value` to the `forecast_outcomes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `forecast_outcomes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "evaluation_status" AS ENUM ('correct', 'incorrect');

-- DropIndex
DROP INDEX "forecast_outcomes_observed_at_idx";

-- AlterTable
ALTER TABLE "forecast_outcomes" DROP COLUMN "accuracy_score",
DROP COLUMN "actual_direction",
DROP COLUMN "observed_at",
ADD COLUMN     "evaluated_at" TIMESTAMPTZ(3) NOT NULL,
ADD COLUMN     "expected_value" DECIMAL(24,8) NOT NULL,
ADD COLUMN     "status" "evaluation_status" NOT NULL;

-- CreateIndex
CREATE INDEX "forecast_outcomes_status_evaluated_at_idx" ON "forecast_outcomes"("status", "evaluated_at");

-- CreateIndex
CREATE INDEX "forecast_outcomes_evaluated_at_idx" ON "forecast_outcomes"("evaluated_at");
