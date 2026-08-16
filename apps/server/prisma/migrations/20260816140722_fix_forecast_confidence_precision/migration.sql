/*
  Warnings:

  - You are about to alter the column `confidence` on the `forecasts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,4)` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "forecasts" ALTER COLUMN "confidence" SET DATA TYPE DECIMAL(5,2);
