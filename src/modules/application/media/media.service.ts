import { Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import appConfig from 'src/config/app.config';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import { Category, Prisma } from '@prisma/client';

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  // Find media by category
  async findMediaByCategory(category: Category, options: PaginationOptions) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const baseWhere = Prisma.sql`WHERE status = 'Published'::"Status" AND categories @> ARRAY[${category}]::"Category"[]`;

      const countQuery = Prisma.sql`
        SELECT COUNT(*) FROM (
          SELECT 1 FROM "movies" ${baseWhere}
          UNION ALL
          SELECT 1 FROM "series" ${baseWhere}
        ) AS total_count;
      `;

      const dataQuery = Prisma.sql`
        SELECT id, title, description, "movie_thumbnail" AS thumbnail, created_at, duration, 'movie' AS type
        FROM "movies" ${baseWhere}
        UNION ALL
        SELECT id, title, description, "series_thumbnail" AS thumbnail, created_at, NULL AS duration, 'series' AS type
        FROM "series" ${baseWhere}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const [totalResult, results]: [any[], any[]] =
        await this.prisma.$transaction([
          this.prisma.$queryRaw(countQuery),
          this.prisma.$queryRaw(dataQuery),
        ]);

      const totalItems = Number(totalResult[0].count);
      const totalPages = Math.ceil(totalItems / limit);

      const config = appConfig();
      const formattedMedia = results.map((item) => {
        let thumbnailUrl = null;
        if (item.thumbnail) {
          const storagePath =
            item.type === 'movie'
              ? config.storageUrl.movie
              : config.storageUrl.series;
          const thumbnailPath = `${storagePath}/${item.thumbnail}`;
          thumbnailUrl = SojebStorage.url(thumbnailPath);
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          duration: item.duration,
          thumbnail: thumbnailUrl,
          created_at: item.created_at,
          type: item.type,
        };
      });

      return {
        success: true,
        message: 'Media fetched successfully.',
        data: formattedMedia,
        meta: {
          totalItems,
          itemCount: results.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
      };
    } catch (error) {
      console.error('Error fetching media by category:', error);
      return {
        success: false,
        message: 'An error occurred while fetching media by category.',
      };
    }
  }

  // Get recent media
  async getRecentMedia(options: PaginationOptions) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const baseWhere = Prisma.sql`WHERE status = 'Published'::"Status"`;

      const countQuery = Prisma.sql`
        SELECT COUNT(*) FROM (
          SELECT 1 FROM "movies" ${baseWhere}
          UNION ALL
          SELECT 1 FROM "series" ${baseWhere}
        ) AS total_count;
      `;

      const dataQuery = Prisma.sql`
        SELECT id, title, description, "movie_thumbnail" AS thumbnail, created_at, duration, 'movie' AS type
        FROM "movies" ${baseWhere}
        UNION ALL
        SELECT id, title, description, "series_thumbnail" AS thumbnail, created_at, NULL AS duration, 'series' AS type
        FROM "series" ${baseWhere}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const [totalResult, results]: [any[], any[]] =
        await this.prisma.$transaction([
          this.prisma.$queryRaw(countQuery),
          this.prisma.$queryRaw(dataQuery),
        ]);

      const totalItems = Number(totalResult[0].count);
      const totalPages = Math.ceil(totalItems / limit);

      const config = appConfig();
      const formattedMedia = results.map((item) => {
        let thumbnailUrl = null;
        if (item.thumbnail) {
          const storagePath =
            item.type === 'movie'
              ? config.storageUrl.movie
              : config.storageUrl.series;
          const thumbnailPath = `${storagePath}/${item.thumbnail}`;
          thumbnailUrl = SojebStorage.url(thumbnailPath);
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          duration: item.duration,
          thumbnail: thumbnailUrl,
          created_at: item.created_at,
          type: item.type,
        };
      });

      return {
        success: true,
        message: 'Recent media fetched successfully.',
        data: formattedMedia,
        meta: {
          totalItems,
          itemCount: results.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
      };
    } catch (error) {
      console.error('Error fetching recent media:', error);
      return {
        success: false,
        message: 'An error occurred while fetching recent media.',
      };
    }
  }

  async findMediaById(id: string) {
    try {
      const movie = await this.prisma.movie.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          genres: true,
          duration: true,
          movie_trailer: true,
          movie_thumbnail: true,
          director_name: true,
          director_thumbnail: true,
          release_date: true,
          casts: {
            select: {
              id: true,
              name: true,
              description: true,
              cast_thumbnail: true,
            },
          },
        },
      });

      if (movie) {
        const config = appConfig();
        const formattedCasts = movie.casts.map((cast) => ({
          ...cast,
          cast_thumbnail: cast.cast_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.cast}/${cast.cast_thumbnail}`,
              )
            : null,
        }));

        const formattedMovie = {
          ...movie,
          type: 'movie',
          movie_thumbnail: movie.movie_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.movie}/${movie.movie_thumbnail}`,
              )
            : null,
          movie_trailer: movie.movie_trailer
            ? SojebStorage.url(
                `${config.storageUrl.movie}/${movie.movie_trailer}`,
              )
            : null,
          director_thumbnail: movie.director_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.movie_director}/${movie.director_thumbnail}`,
              )
            : null,
          casts: formattedCasts,
        };

        return {
          success: true,
          message: 'Movie details fetched successfully.',
          data: formattedMovie,
        };
      }

      const series = await this.prisma.series.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          genres: true,
          series_trailer: true,
          series_thumbnail: true,
          director_name: true,
          director_thumbnail: true,
          release_date: true,
          casts: {
            select: {
              id: true,
              name: true,
              description: true,
              cast_thumbnail: true,
            },
          },
          seasons: {
            orderBy: { created_at: 'asc' },
            select: {
              id: true,
              title: true,
              season_thumbnail: true,
              release_date: true,
              episodes: {
                orderBy: { episode_number: 'asc' },
                select: {
                  id: true,
                  episode_number: true,
                  title: true,
                  description: true,
                  duration: true,
                  release_date: true,
                  episode_thumbnails: true,
                },
              },
            },
          },
        },
      });

      if (series) {
        const config = appConfig();
        const formattedCasts = series.casts.map((cast) => ({
          ...cast,
          cast_thumbnail: cast.cast_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.cast}/${cast.cast_thumbnail}`,
              )
            : null,
        }));

        const formattedSeasons = series.seasons.map((season) => ({
          ...season,
          season_thumbnail: season.season_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.season}/${season.season_thumbnail}`,
              )
            : null,
          episodes: season.episodes.map((episode) => ({
            ...episode,
            episode_thumbnails: episode.episode_thumbnails
              ? SojebStorage.url(
                  `${config.storageUrl.episode}/${episode.episode_thumbnails}`,
                )
              : null,
          })),
        }));

        const formattedSeries = {
          ...series,
          type: 'series',
          series_thumbnail: series.series_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.series}/${series.series_thumbnail}`,
              )
            : null,
          series_trailer: series.series_trailer
            ? SojebStorage.url(
                `${config.storageUrl.series}/${series.series_trailer}`,
              )
            : null,
          director_thumbnail: series.director_thumbnail
            ? SojebStorage.url(
                `${config.storageUrl.series_director}/${series.director_thumbnail}`,
              )
            : null,
          casts: formattedCasts,
          seasons: formattedSeasons,
        };

        return {
          success: true,
          message: 'Series details fetched successfully.',
          data: formattedSeries,
        };
      }

      // ধাপ ৩: যদি কোনোটিই না পাওয়া যায়
      return { success: false, message: `Media with ID "${id}" not found.` };
    } catch (error) {
      console.error(`Error fetching media with ID ${id}:`, error);
      return {
        success: false,
        message: 'An error occurred while fetching media details.',
      };
    }
  }

  async getMovieWatchUrl(id: string) {
    try {
      const movie = await this.prisma.movie.findUnique({
        where: { id: id },
        select: {
          video: true,
          title: true,
          description: true,
          casts: {
            select: {
              id: true,
              name: true,
              description: true,
              cast_thumbnail: true,
            },
          },
        },
      });

      if (!movie) {
        return {
          success: false,
          message: `Movie with ID "${id}" not found.`,
        };
      }

      if (!movie.video) {
        return {
          success: false,
          message: `Video for the movie "${movie.title}" is not available.`,
        };
      }

      const videoPath = `${appConfig().storageUrl.movie}/${movie.video}`;
      const videoUrl = SojebStorage.url(videoPath);
      const formattedCasts = movie.casts.map((cast) => {
        let castThumbnailUrl = null;
        if (cast.cast_thumbnail) {
          const thumbnailPath = `${appConfig().storageUrl.cast}/${cast.cast_thumbnail}`;
          castThumbnailUrl = SojebStorage.url(thumbnailPath);
        }
        return {
          ...cast,
          cast_thumbnail: castThumbnailUrl,
        };
      });

      return {
        success: true,
        message: 'Video URL fetched successfully.',
        data: {
          title: movie.title,
          url: videoUrl,
          description: movie.description,
          casts: formattedCasts,
        },
      };
    } catch (error) {
      console.error(`Error fetching video URL for movie ID ${id}:`, error);
      return {
        success: false,
        message: 'An error occurred while fetching the video URL.',
      };
    }
  }
}
