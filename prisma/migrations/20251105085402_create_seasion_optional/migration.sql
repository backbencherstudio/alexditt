/*
  Warnings:

  - A unique constraint covering the columns `[series_id,episode_number]` on the table `episodes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "episodes" DROP CONSTRAINT "episodes_series_id_fkey";

-- DropIndex
DROP INDEX "episodes_season_id_episode_number_key";

-- AlterTable
ALTER TABLE "episodes" ALTER COLUMN "season_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "episodes_series_id_episode_number_key" ON "episodes"("series_id", "episode_number");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
