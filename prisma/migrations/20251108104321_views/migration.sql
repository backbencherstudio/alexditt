/*
  Warnings:

  - The values [LIVE,PUBLISHED,UNPUBLISHED,DRAFT] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `created_at` on table `seasons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `seasons` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('Live', 'Published', 'Unpublished', 'Draft');
ALTER TABLE "movies" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "series" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "movies" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "series" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "movies" ALTER COLUMN "status" SET DEFAULT 'Draft';
ALTER TABLE "series" ALTER COLUMN "status" SET DEFAULT 'Draft';
COMMIT;

-- AlterTable
ALTER TABLE "movies" ALTER COLUMN "status" SET DEFAULT 'Draft',
ALTER COLUMN "views" DROP NOT NULL;

-- AlterTable
ALTER TABLE "seasons" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "series" ALTER COLUMN "status" SET DEFAULT 'Draft',
ALTER COLUMN "views" DROP NOT NULL;
