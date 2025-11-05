/*
  Warnings:

  - The values [Action,Adventure,Comedy,Drama,Romance,Thriller,Horror,Sci-Fi,Fantasy,Mystery,Crime,Documentary,Family,Kids,Musical,Biography,History,Sport,War,Western,Reality,Short Film,Stand-up,Classic,Netflix Original,Foreign,Anime,Romantic Comedy,True Crime] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `season_number` on the `seasons` table. All the data in the column will be lost.
  - You are about to drop the `_GenreToMovie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GenreToSeries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `genres` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[series_id,id]` on the table `seasons` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Historical', 'Horror', 'Music', 'Mystery', 'News', 'Reality', 'Romance', 'Sci_Fi', 'Thriller', 'War', 'Western', 'Sports', 'Music_Video', 'Talk_Show', 'Short_Film', 'Game_Show');

-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('Series', 'Movie', 'K_Drama', 'Animation', 'Tv_Show', 'Short_Film', 'Sports', 'New_Release', 'Trending_Now', 'Award_Winning', 'Classics');
ALTER TABLE "movies" ALTER COLUMN "categories" TYPE "Category_new"[] USING ("categories"::text::"Category_new"[]);
ALTER TABLE "series" ALTER COLUMN "categories" TYPE "Category_new"[] USING ("categories"::text::"Category_new"[]);
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "Category_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "_GenreToMovie" DROP CONSTRAINT "_GenreToMovie_A_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToMovie" DROP CONSTRAINT "_GenreToMovie_B_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToSeries" DROP CONSTRAINT "_GenreToSeries_A_fkey";

-- DropForeignKey
ALTER TABLE "_GenreToSeries" DROP CONSTRAINT "_GenreToSeries_B_fkey";

-- DropIndex
DROP INDEX "seasons_series_id_season_number_key";

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "genres" "Genre"[];

-- AlterTable
ALTER TABLE "seasons" DROP COLUMN "season_number";

-- DropTable
DROP TABLE "_GenreToMovie";

-- DropTable
DROP TABLE "_GenreToSeries";

-- DropTable
DROP TABLE "genres";

-- CreateIndex
CREATE UNIQUE INDEX "seasons_series_id_id_key" ON "seasons"("series_id", "id");
