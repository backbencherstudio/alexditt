-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "kids_mode" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "kids_mode" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "app_updates" BOOLEAN DEFAULT true,
ADD COLUMN     "auto_play" BOOLEAN DEFAULT true,
ADD COLUMN     "general_notifications" BOOLEAN DEFAULT true,
ADD COLUMN     "kids_mode" BOOLEAN DEFAULT false,
ADD COLUMN     "lang_english" BOOLEAN DEFAULT true,
ADD COLUMN     "lang_german" BOOLEAN DEFAULT false,
ADD COLUMN     "lang_polish" BOOLEAN DEFAULT false,
ADD COLUMN     "new_release_movies" BOOLEAN DEFAULT true;

-- CreateTable
CREATE TABLE "like_comments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "is_like" BOOLEAN DEFAULT false,
    "is_dislike" BOOLEAN DEFAULT false,
    "is_favorite" BOOLEAN DEFAULT false,
    "is_saved" BOOLEAN DEFAULT false,
    "is_comment" BOOLEAN DEFAULT false,
    "comment_text" TEXT,
    "user_id" TEXT,
    "movie_id" TEXT,
    "series_id" TEXT,

    CONSTRAINT "like_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "like_comments" ADD CONSTRAINT "like_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like_comments" ADD CONSTRAINT "like_comments_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like_comments" ADD CONSTRAINT "like_comments_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
