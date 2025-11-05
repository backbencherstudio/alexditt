-- AlterTable
ALTER TABLE "episodes" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "movie_tailer" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "series_tailer" TEXT,
ALTER COLUMN "description" DROP NOT NULL;
