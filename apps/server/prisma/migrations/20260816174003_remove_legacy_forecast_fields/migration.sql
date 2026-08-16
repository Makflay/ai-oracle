/*
  Warnings:

  - You are about to drop the column `direction` on the `forecasts` table. All the data in the column will be lost.
  - You are about to drop the column `failure_reason` on the `forecasts` table. All the data in the column will be lost.
  - You are about to drop the column `model_version` on the `forecasts` table. All the data in the column will be lost.
  - You are about to drop the column `risk_level` on the `forecasts` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `forecasts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "forecasts" DROP COLUMN "direction",
DROP COLUMN "failure_reason",
DROP COLUMN "model_version",
DROP COLUMN "risk_level",
DROP COLUMN "summary";
