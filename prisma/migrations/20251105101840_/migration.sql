/*
  Warnings:

  - You are about to drop the column `movie_tailer` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `series_tailer` on the `series` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "movies" DROP COLUMN "movie_tailer",
ADD COLUMN     "movie_trailer" TEXT;

-- AlterTable
ALTER TABLE "series" DROP COLUMN "series_tailer",
ADD COLUMN     "series_trailer" TEXT;
