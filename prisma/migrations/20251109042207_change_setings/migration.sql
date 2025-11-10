/*
  Warnings:

  - You are about to drop the column `app_updates` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `auto_play` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `general_notifications` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `kids_mode` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `lang_english` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `lang_german` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `lang_polish` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `new_release_movies` on the `settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "settings" DROP COLUMN "app_updates",
DROP COLUMN "auto_play",
DROP COLUMN "general_notifications",
DROP COLUMN "kids_mode",
DROP COLUMN "lang_english",
DROP COLUMN "lang_german",
DROP COLUMN "lang_polish",
DROP COLUMN "new_release_movies";

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "app_updates" BOOLEAN DEFAULT true,
ADD COLUMN     "auto_play" BOOLEAN DEFAULT true,
ADD COLUMN     "general_notifications" BOOLEAN DEFAULT true,
ADD COLUMN     "kids_mode" BOOLEAN DEFAULT false,
ADD COLUMN     "lang_english" BOOLEAN DEFAULT true,
ADD COLUMN     "lang_german" BOOLEAN DEFAULT false,
ADD COLUMN     "lang_polish" BOOLEAN DEFAULT false,
ADD COLUMN     "new_release_movies" BOOLEAN DEFAULT true;
