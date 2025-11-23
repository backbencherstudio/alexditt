/*
  Warnings:

  - You are about to drop the column `categories` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `series` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "movies" DROP COLUMN "categories",
ADD COLUMN     "categorie_id" TEXT;

-- AlterTable
ALTER TABLE "series" DROP COLUMN "categories",
ADD COLUMN     "categorie_id" TEXT;

-- DropEnum
DROP TYPE "Category";

-- AddForeignKey
ALTER TABLE "movies" ADD CONSTRAINT "movies_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
