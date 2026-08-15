/*
  Warnings:

  - You are about to drop the column `targetDate` on the `forecasts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "forecasts" DROP COLUMN "targetDate",
ALTER COLUMN "target_at" SET DATA TYPE TIMESTAMPTZ(3);
