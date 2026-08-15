/*
  Warnings:

  - A unique constraint covering the columns `[raw_record_id,type]` on the table `metrics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `normalized_value` to the `metrics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "metric_type" ADD VALUE 'downloads';
ALTER TYPE "metric_type" ADD VALUE 'likes';
ALTER TYPE "metric_type" ADD VALUE 'mentions';
ALTER TYPE "metric_type" ADD VALUE 'score';
ALTER TYPE "metric_type" ADD VALUE 'comments';
ALTER TYPE "metric_type" ADD VALUE 'engagement';
ALTER TYPE "metric_type" ADD VALUE 'publications';

-- AlterTable
ALTER TABLE "metrics" ADD COLUMN     "normalized_value" DECIMAL(5,2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "metrics_raw_record_id_type_key" ON "metrics"("raw_record_id", "type");
