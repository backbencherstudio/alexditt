/*
  Warnings:

  - A unique constraint covering the columns `[series_id,id]` on the table `episodes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "episodes_series_id_episode_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "episodes_series_id_id_key" ON "episodes"("series_id", "id");
