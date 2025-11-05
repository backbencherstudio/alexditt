/*
  Warnings:

  - You are about to drop the column `season_thumnail` on the `seasons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "seasons" DROP COLUMN "season_thumnail",
ADD COLUMN     "season_thumbnail" TEXT;
