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

  // private method for get kids_mode
  private async getKidsModeFilter(userId: string): Promise<Prisma.Sql> {
    if (!userId) {
      return Prisma.sql`AND "kids_mode" = false`;
    }

    const userSettings = await this.prisma.userSetting.findFirst({
      where: { user_id: userId },
      select: { kids_mode: true },
    });

    const isKidsModeEnabled = userSettings?.kids_mode ?? false;
    if (isKidsModeEnabled) {
      return Prisma.sql`AND "kids_mode" = true`;
    }

    return Prisma.empty;
  }

  // Find media by category
  async findMediaByCategory(
    userId: string,
    categoryId: string, // Changed from Enum to String (ID)
    options: PaginationOptions,
  ) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      // Check kids mode (Assuming this returns a Prisma.sql fragment)
      const kidsModeFilter = await this.getKidsModeFilter(userId);

      // UPDATED WHERE CLAUSE:
      // Using category_id instead of Enum Array check
      const baseWhere = Prisma.sql`
        WHERE status = 'Published'::"Status" 
        AND category_id = ${categoryId} 
        ${kidsModeFilter}
      `;

      // Count Query (Combining both tables)
      const countQuery = Prisma.sql`
        SELECT COUNT(*) FROM (
          SELECT 1 FROM "movies" ${baseWhere}
          UNION ALL
          SELECT 1 FROM "series" ${baseWhere}
        ) AS total_count;
      `;

      // Data Query (Fetching combined data)
      const dataQuery = Prisma.sql`
        SELECT id, title, description, "movie_thumbnail" AS thumbnail, created_at, duration, 'movie' AS type
        FROM "movies" ${baseWhere}
        UNION ALL
        SELECT id, title, description, "series_thumbnail" AS thumbnail, created_at, NULL AS duration, 'series' AS type
        FROM "series" ${baseWhere}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      // Execute transaction
      const [totalResult, results]: [any[], any[]] =
        await this.prisma.$transaction([
          this.prisma.$queryRaw(countQuery),
          this.prisma.$queryRaw(dataQuery),
        ]);

      // Pagination Logic
      const totalItems = totalResult[0] ? Number(totalResult[0].count) : 0;
      const totalPages = Math.ceil(totalItems / limit);

      const config = appConfig();

      // Format Data (Thumbnail Handling)
      const formattedMedia = results.map((item) => {
        let thumbnailUrl = null;
        if (item.thumbnail) {
          const storagePath =
            item.type === 'movie'
              ? config.storageUrl.movie
              : config.storageUrl.series;

          // Assuming SojebStorage generates the full URL
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
  async getRecentMedia(userId: string, options: PaginationOptions) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      // check kids_mode
      const kidsModeFilter = await this.getKidsModeFilter(userId);
      const baseWhere = Prisma.sql`WHERE status = 'Published'::"Status" ${kidsModeFilter}`;

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

      const formattedMedia = results.map((item) => {
        let thumbnailUrl = null;
        if (item.thumbnail) {
          const storagePath =
            item.type === 'movie'
              ? appConfig().storageUrl.movie
              : appConfig().storageUrl.series;
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

  // trending worldwide
  async getTopViewsMedia(userId: string, options: PaginationOptions) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const kidsModeFilter = await this.getKidsModeFilter(userId);
      const baseWhere = Prisma.sql`WHERE status = 'Published'::"Status" ${kidsModeFilter}`;

      const countQuery = Prisma.sql`
        SELECT COUNT(*) FROM (
          SELECT 1 FROM "movies" ${baseWhere}
          UNION ALL
          SELECT 1 FROM "series" ${baseWhere}
        ) AS total_count;
      `;

      const dataQuery = Prisma.sql`
        SELECT id, title, description, "movie_thumbnail" AS thumbnail, created_at, duration, views, 'movie' AS type
        FROM "movies" ${baseWhere}
        UNION ALL
        SELECT id, title, description, "series_thumbnail" AS thumbnail, created_at, NULL AS duration, views, 'series' AS type
        FROM "series" ${baseWhere}
        ORDER BY views DESC, created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const [totalResult, results]: [any[], any[]] =
        await this.prisma.$transaction([
          this.prisma.$queryRaw(countQuery),
          this.prisma.$queryRaw(dataQuery),
        ]);

      const totalItems = Number(totalResult[0].count);
      const totalPages = Math.ceil(totalItems / limit);

      const formattedMedia = results.map((item) => {
        let thumbnailUrl = null;
        if (item.thumbnail) {
          const storagePath =
            item.type === 'movie'
              ? appConfig().storageUrl.movie
              : appConfig().storageUrl.series;
          const thumbnailPath = `${storagePath}/${item.thumbnail}`;
          thumbnailUrl = SojebStorage.url(thumbnailPath);
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          duration: item.duration,
          thumbnail: thumbnailUrl,
          views: item.views,
          created_at: item.created_at,
          type: item.type,
        };
      });

      return {
        success: true,
        message: 'Top views media fetched successfully.',
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
      console.error('Error fetching top views media:', error);
      return {
        success: false,
        message: 'An error occurred while fetching top views media.',
      };
    }
  }

  async findMediaById(userId: string, id: string) {
    try {
      const userSettings = await this.prisma.userSetting.findFirst({
        where: { user_id: userId },
        select: { kids_mode: true },
      });
      const isKidsModeEnabled = userSettings?.kids_mode ?? false;

      const movieWhereCondition: Prisma.MovieWhereInput = { id };
      const seriesWhereCondition: Prisma.SeriesWhereInput = { id };

      if (isKidsModeEnabled) {
        movieWhereCondition.kids_mode = true;
        seriesWhereCondition.kids_mode = true;
      }

      const movie = await this.prisma.movie.findFirst({
        where: movieWhereCondition,
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

      const series = await this.prisma.series.findFirst({
        where: seriesWhereCondition,
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

      return { success: false, message: `Media with ID "${id}" not found.` };
    } catch (error) {
      console.error(`Error fetching media with ID ${id}:`, error);
      return {
        success: false,
        message: 'An error occurred while fetching media details.',
      };
    }
  }

  async getMovieWatchUrl(userId: string, id: string) {
    try {
      const userSettings = await this.prisma.userSetting.findFirst({
        where: { user_id: userId },
        select: { kids_mode: true },
      });
      const isKidsModeEnabled = userSettings?.kids_mode ?? false;

      const movieWhereCondition: Prisma.MovieWhereInput = { id };

      if (isKidsModeEnabled) {
        movieWhereCondition.kids_mode = true;
      }
      const movie = await this.prisma.movie.findFirst({
        where: movieWhereCondition,
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          video: true,

          // casts: {
          //   select: {
          //     id: true,
          //     name: true,
          //     description: true,
          //     cast_thumbnail: true,
          //   },
          // },
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

      await this.prisma.movie.update({
        where: { id: movie.id },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      const videoPath = `${appConfig().storageUrl.movie}/${movie.video}`;
      const videoUrl = SojebStorage.url(videoPath);
      // const formattedCasts = movie.casts.map((cast) => {
      //   let castThumbnailUrl = null;
      //   if (cast.cast_thumbnail) {
      //     const thumbnailPath = `${appConfig().storageUrl.cast}/${cast.cast_thumbnail}`;
      //     castThumbnailUrl = SojebStorage.url(thumbnailPath);
      //   }
      //   return {
      //     ...cast,
      //     cast_thumbnail: castThumbnailUrl,
      //   };
      // });

      return {
        success: true,
        message: 'Video URL fetched successfully.',
        data: {
          id: movie.id,
          duration: movie.duration,
          title: movie.title,
          url: videoUrl,
          description: movie.description,
          // casts: formattedCasts,
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

  // get season by id
  async findSeasonById(userId: string, id: string) {
    try {
      const userSettings = await this.prisma.userSetting.findFirst({
        where: { user_id: userId },
        select: { kids_mode: true },
      });
      const isKidsModeEnabled = userSettings?.kids_mode ?? false;

      const season = await this.prisma.season.findFirst({
        where: {
          id: id,
          ...(isKidsModeEnabled && { series: { kids_mode: true } }),
        },
        select: {
          id: true,
          title: true,
          release_date: true,
          season_thumbnail: true,
          series: {
            select: {
              id: true,
              title: true,
              description: true,
              series_thumbnail: true,
            },
          },
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
      });

      if (!season) {
        return {
          success: false,
          message: `Season with ID "${id}" not found or not accessible.`,
        };
      }

      const formattedSeason = {
        ...season,
        season_thumbnail: season.season_thumbnail
          ? SojebStorage.url(
              `${appConfig().storageUrl.season}/${season.season_thumbnail}`,
            )
          : null,
        series: {
          ...season.series,
          series_thumbnail: season.series.series_thumbnail
            ? SojebStorage.url(
                `${appConfig().storageUrl.series}/${season.series.series_thumbnail}`,
              )
            : null,
        },
        episodes: season.episodes.map((episode) => ({
          ...episode,
          episode_thumbnails: episode.episode_thumbnails
            ? SojebStorage.url(
                `${appConfig().storageUrl.episode}/${episode.episode_thumbnails}`,
              )
            : null,
        })),
      };

      return {
        success: true,
        message: 'Season details fetched successfully.',
        data: formattedSeason,
      };
    } catch (error) {
      console.error(`Error fetching season with ID ${id}:`, error);
      return {
        success: false,
        message: 'An error occurred while fetching season details.',
      };
    }
  }

  // get episode details by id
  async findEpisodeById(userId: string, id: string) {
    try {
      const userSettings = await this.prisma.userSetting.findFirst({
        where: { user_id: userId },
        select: { kids_mode: true },
      });
      const isKidsModeEnabled = userSettings?.kids_mode ?? false;

      const episode = await this.prisma.episode.findFirst({
        where: {
          id: id,
          ...(isKidsModeEnabled && { series: { kids_mode: true } }),
        },
        select: {
          id: true,
          episode_number: true,
          title: true,
          description: true,
          duration: true,
          release_date: true,
          episode_thumbnails: true,
          episode_videos: true,
          series: {
            select: {
              id: true,
              title: true,
              description: true,
              series_thumbnail: true,
            },
          },
          season: {
            select: { id: true, title: true, season_thumbnail: true },
          },
        },
      });

      if (!episode) {
        return {
          success: false,
          message: `Episode with ID "${id}" not found or not accessible.`,
        };
      }

      let moreEpisodes = [];
      if (episode.season?.id) {
        moreEpisodes = await this.prisma.episode.findMany({
          where: {
            season_id: episode.season.id,
            id: { not: episode.id },
          },
          orderBy: { episode_number: 'asc' },
          select: {
            id: true,
            episode_number: true,
            title: true,
            duration: true,
            episode_thumbnails: true,
          },
        });
      } else if (episode.series?.id) {
        moreEpisodes = await this.prisma.episode.findMany({
          where: {
            series_id: episode.series.id,
            season_id: null,
            id: { not: episode.id },
          },
          orderBy: { episode_number: 'asc' },
          select: {
            id: true,
            episode_number: true,
            title: true,
            duration: true,
            episode_thumbnails: true,
          },
        });
      }

      const formattedEpisode = {
        ...episode,
        episode_thumbnails: episode.episode_thumbnails
          ? SojebStorage.url(
              `${appConfig().storageUrl.episode}/${episode.episode_thumbnails}`,
            )
          : null,
        episode_videos: episode.episode_videos
          ? SojebStorage.url(
              `${appConfig().storageUrl.episode}/${episode.episode_videos}`,
            )
          : null,
        series: episode.series
          ? {
              ...episode.series,
              series_thumbnail: episode.series.series_thumbnail
                ? SojebStorage.url(
                    `${appConfig().storageUrl.series}/${episode.series.series_thumbnail}`,
                  )
                : null,
            }
          : null,
        season: episode.season
          ? {
              ...episode.season,
              season_thumbnail: episode.season.season_thumbnail
                ? SojebStorage.url(
                    `${appConfig().storageUrl.season}/${episode.season.season_thumbnail}`,
                  )
                : null,
            }
          : null,
      };

      const formattedMoreEpisodes = moreEpisodes.map((ep) => ({
        ...ep,
        episode_thumbnails: ep.episode_thumbnails
          ? SojebStorage.url(
              `${appConfig().storageUrl.episode}/${ep.episode_thumbnails}`,
            )
          : null,
      }));

      const finalData = {
        ...formattedEpisode,
        more_episodes: formattedMoreEpisodes,
      };

      return {
        success: true,
        message: 'Episode details fetched successfully.',
        data: finalData,
      };
    } catch (error) {
      console.error(`Error fetching episode with ID ${id}:`, error);
      return {
        success: false,
        message: 'An error occurred while fetching episode details.',
      };
    }
  }

  // Watch episode by episodeId
  async getEpisodeWatchUrl(userId: string, id: string) {
    try {
      const userSettings = await this.prisma.userSetting.findFirst({
        where: { user_id: userId },
        select: { kids_mode: true },
      });
      const isKidsModeEnabled = userSettings?.kids_mode ?? false;

      const episode = await this.prisma.episode.findFirst({
        where: {
          id: id,
          ...(isKidsModeEnabled && { series: { kids_mode: true } }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          episode_videos: true,
          series_id: true,
          season_id: true,
        },
      });

      if (!episode) {
        return {
          success: false,
          message: `Episode with ID "${id}" not found or not accessible.`,
        };
      }

      if (!episode.episode_videos) {
        return {
          success: false,
          message: `Video for the episode "${episode.title}" is not available.`,
        };
      }

      if (episode.series_id) {
        await this.prisma.series.update({
          where: { id: episode.series_id },
          data: {
            views: {
              increment: 1,
            },
          },
        });
      }

      let moreEpisodes = [];
      if (episode.season_id) {
        moreEpisodes = await this.prisma.episode.findMany({
          where: {
            season_id: episode.season_id,
            id: { not: episode.id },
          },
          orderBy: { episode_number: 'asc' },
          select: {
            id: true,
            episode_number: true,
            title: true,
            duration: true,
            episode_thumbnails: true,
          },
        });
      } else if (episode.series_id) {
        moreEpisodes = await this.prisma.episode.findMany({
          where: {
            series_id: episode.series_id,
            season_id: null,
            id: { not: episode.id },
          },
          orderBy: { episode_number: 'asc' },
          select: {
            id: true,
            episode_number: true,
            title: true,
            duration: true,
            episode_thumbnails: true,
          },
        });
      }

      const videoUrl = SojebStorage.url(
        `${appConfig().storageUrl.episode}/${episode.episode_videos}`,
      );

      const formattedMoreEpisodes = moreEpisodes.map((ep) => ({
        ...ep,
        episode_thumbnails: ep.episode_thumbnails
          ? SojebStorage.url(
              `${appConfig().storageUrl.episode}/${ep.episode_thumbnails}`,
            )
          : null,
      }));

      const finalData = {
        id: episode.id,
        title: episode.title,
        description: episode.description,
        url: videoUrl,
        more_episodes: formattedMoreEpisodes,
      };

      return {
        success: true,
        message: 'Episode video URL and related episodes fetched successfully.',
        data: finalData,
      };
    } catch (error) {
      console.error(`Error fetching video URL for episode ID ${id}:`, error);
      return {
        success: false,
        message: 'An error occurred while fetching the video URL.',
      };
    }
  }

  // global search by movie, episode, season, series tile
  async searchMedia(userId: string, query: string, options: PaginationOptions) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const kidsModeFilter = await this.getKidsModeFilter(userId);

      const searchQuery = Prisma.sql`AND title ILIKE ${'%' + query + '%'}`;

      const movieWhere = Prisma.sql`WHERE status = 'Published'::"Status" ${kidsModeFilter} ${searchQuery}`;
      const seriesWhere = Prisma.sql`WHERE status = 'Published'::"Status" ${kidsModeFilter} ${searchQuery}`;

      const seasonJoin = Prisma.sql`FROM "seasons" s JOIN "series" p ON s.series_id = p.id WHERE p.status = 'Published'::"Status" ${kidsModeFilter} AND s.title ILIKE ${'%' + query + '%'}`;
      const episodeJoin = Prisma.sql`FROM "episodes" e JOIN "series" p ON e.series_id = p.id WHERE p.status = 'Published'::"Status" ${kidsModeFilter} AND e.title ILIKE ${'%' + query + '%'}`;

      const countQuery = Prisma.sql`
        SELECT SUM(count) FROM (
          SELECT COUNT(*) FROM "movies" ${movieWhere}
          UNION ALL
          SELECT COUNT(*) FROM "series" ${seriesWhere}
          UNION ALL
          SELECT COUNT(*) ${seasonJoin}
          UNION ALL
          SELECT COUNT(*) ${episodeJoin}
        ) AS total;
      `;

      const dataQuery = Prisma.sql`
        SELECT id, title, description, "movie_thumbnail" AS thumbnail, created_at, duration, 'movie' AS type 
        FROM "movies" ${movieWhere}
        UNION ALL
        SELECT id, title, description, "series_thumbnail" AS thumbnail, created_at, NULL::text AS duration, 'series' AS type 
        FROM "series" ${seriesWhere}
        UNION ALL
        SELECT s.id, s.title, p.description, s.season_thumbnail AS thumbnail, s.created_at, NULL::text AS duration, 'season' AS type 
        ${seasonJoin}
        UNION ALL
        SELECT e.id, e.title, e.description, e.episode_thumbnails AS thumbnail, e.created_at, e.duration::text AS duration, 'episode' AS type 
        ${episodeJoin}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const [totalResult, results]: [any[], any[]] =
        await this.prisma.$transaction([
          this.prisma.$queryRaw(countQuery),
          this.prisma.$queryRaw(dataQuery),
        ]);

      const totalItems = Number(totalResult[0].sum);
      const totalPages = Math.ceil(totalItems / limit);

      const formattedMedia = results.map((item) => {
        let thumbnailUrl = null;
        if (item.thumbnail) {
          let storagePath = '';
          if (item.type === 'movie') storagePath = appConfig().storageUrl.movie;
          else if (item.type === 'series')
            storagePath = appConfig().storageUrl.series;
          else if (item.type === 'season')
            storagePath = appConfig().storageUrl.season;
          else if (item.type === 'episode')
            storagePath = appConfig().storageUrl.episode;

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
        message: 'Search results fetched successfully.',
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
      console.error('Error during global search:', error);
      return {
        success: false,
        message: 'An error occurred during the search.',
      };
    }
  }
}
