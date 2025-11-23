/*
  Warnings:

  - You are about to drop the column `categorie_id` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `categorie_id` on the `series` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "movies" DROP CONSTRAINT "movies_categorie_id_fkey";

-- DropForeignKey
ALTER TABLE "series" DROP CONSTRAINT "series_categorie_id_fkey";

-- AlterTable
ALTER TABLE "movies" DROP COLUMN "categorie_id",
ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "series" DROP COLUMN "categorie_id",
ADD COLUMN     "category_id" TEXT;

-- AddForeignKey
ALTER TABLE "movies" ADD CONSTRAINT "movies_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
