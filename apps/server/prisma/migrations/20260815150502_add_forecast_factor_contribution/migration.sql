/*
  Warnings:

  - Added the required column `contribution` to the `forecast_factors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forecast_factors" ADD COLUMN     "contribution" DECIMAL(7,4) NOT NULL;
