-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Live', 'Published', 'Unpublished', 'Draft');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Action', 'Adventure', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi', 'Fantasy', 'Mystery', 'Crime', 'Documentary', 'Animation', 'Family', 'Kids', 'Musical', 'Biography', 'History', 'Sport', 'War', 'Western', 'Reality', 'Short Film', 'Stand-up', 'Classic', 'Netflix Original', 'Foreign', 'Anime', 'Romantic Comedy', 'True Crime');

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "category" "Category"[],
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Draft';
