/*
  Warnings:

  - You are about to drop the column `category` on the `movies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "movies" DROP COLUMN "category",
ADD COLUMN     "categories" "Category"[];
