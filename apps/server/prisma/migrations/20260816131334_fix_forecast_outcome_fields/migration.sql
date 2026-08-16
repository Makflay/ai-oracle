/*
  Warnings:

  - Made the column `actual_value` on table `forecast_outcomes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "forecast_outcomes" ALTER COLUMN "actual_value" SET NOT NULL;
