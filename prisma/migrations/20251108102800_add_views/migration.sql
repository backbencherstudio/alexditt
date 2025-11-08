/*
  Warnings:

  - The values [Live,Published,Unpublished,Draft] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('LIVE', 'PUBLISHED', 'UNPUBLISHED', 'DRAFT');
ALTER TABLE "movies" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "series" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "movies" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "series" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "movies" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "series" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';
