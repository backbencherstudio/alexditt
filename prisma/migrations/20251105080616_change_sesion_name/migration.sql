/*
  Warnings:

  - You are about to drop the column `seccion_thumnail` on the `seasons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "seasons" DROP COLUMN "seccion_thumnail",
ADD COLUMN     "season_thumnail" TEXT;

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "genres" "Genre"[];
