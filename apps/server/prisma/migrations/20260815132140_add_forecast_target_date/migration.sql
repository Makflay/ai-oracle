/*
  Warnings:

  - Added the required column `targetDate` to the `forecasts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forecasts" ADD COLUMN     "targetDate" TIMESTAMPTZ(3) NOT NULL;
