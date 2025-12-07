import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StringHelper } from 'src/common/helper/string.helper';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { Prisma } from '@prisma/client';
import { CreateEpisodeDto } from './dto/create-episode.dto';

@Injectable()
export class SeriesService {
  constructor(private prisma: PrismaService) {}

  // *create series
  async createASeries(
    dto: CreateSeriesDto,
    userId: string,
    parsedCast: any[],
    parsedEpisodes: any[],
    parsedSeasonInfo: any | null,
    seriesThumbnailFile: Express.Multer.File,
    seriesTrailerFile: Express.Multer.File | undefined,
    directorThumbnailFile: Express.Multer.File | undefined,
    seasonThumbnailFile: Express.Multer.File | undefined,
    castThumbnailsMap: Map<string, Express.Multer.File>,
    episodeFilesMap: Map<
      string,
      { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
    >,
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return {
          success: false,
          message: `User with ID "${userId}" not found.`,
        };
      }

      // --- File Upload Logic (Unchanged) ---
      const seriesThumbnailName = `${StringHelper.randomString()}_${seriesThumbnailFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.series}/${seriesThumbnailName}`,
        seriesThumbnailFile.buffer,
      );

      let seriesTrailerName: string | null = null;
      if (seriesTrailerFile) {
        seriesTrailerName = `${StringHelper.randomString()}_${seriesTrailerFile.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.series}/${seriesTrailerName}`,
          seriesTrailerFile.buffer,
        );
      }

      let directorThumbnailName: string | null = null;
      if (directorThumbnailFile) {
        directorThumbnailName = `${StringHelper.randomString()}_${directorThumbnailFile.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.series_director}/${directorThumbnailName}`,
          directorThumbnailFile.buffer,
        );
      }

      let seasonThumbnailName: string | null = null;
      if (seasonThumbnailFile) {
        seasonThumbnailName = `${StringHelper.randomString()}_${seasonThumbnailFile.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.season}/${seasonThumbnailName}`,
          seasonThumbnailFile.buffer,
        );
      }

      const uploadedCastThumbnails = new Map<string, string>();
      for (const [key, file] of castThumbnailsMap.entries()) {
        const fileName = `${StringHelper.randomString()}_${file.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.cast}/${fileName}`,
          file.buffer,
        );
        uploadedCastThumbnails.set(key, fileName);
      }

      const uploadedEpisodeFiles = new Map<
        string,
        { thumbnail?: string; video?: string }
      >();
      for (const [key, filePair] of episodeFilesMap.entries()) {
        const uploadedPair: { thumbnail?: string; video?: string } = {};
        if (filePair.thumbnail) {
          const thumbName = `${StringHelper.randomString()}_${filePair.thumbnail.originalname}`;
          await SojebStorage.put(
            `${appConfig().storageUrl.episode}/${thumbName}`,
            filePair.thumbnail.buffer,
          );
          uploadedPair.thumbnail = thumbName;
        }
        if (filePair.video) {
          const videoName = `${StringHelper.randomString()}_${filePair.video.originalname}`;
          await SojebStorage.put(
            `${appConfig().storageUrl.episode}/${videoName}`,
            filePair.video.buffer,
          );
          uploadedPair.video = videoName;
        }
        uploadedEpisodeFiles.set(key, uploadedPair);
      }
      // --- End File Upload Logic ---

      return await this.prisma.$transaction(async (tx) => {
        const createdSeries = await tx.series.create({
          data: {
            title: dto.title,
            description: dto.description,
            kids_mode: dto.kids_mode,
            release_date: dto.release_date,
            status: dto.status,

            category: {
              connect: {
                id: dto.category_id,
              },
            },

            genres: dto.genres,
            series_thumbnail: seriesThumbnailName,
            series_trailer: seriesTrailerName,
            director_name: dto.director_name,
            director_thumbnail: directorThumbnailName,
            publisher: { connect: { id: userId } },
            casts: {
              create: parsedCast.map((cast) => ({
                name: cast.name,
                description: cast.description,
                cast_thumbnail: uploadedCastThumbnails.get(cast.key) || null,
              })),
            },
          },
        });

        let seasonId: string | null = null;

        if (parsedSeasonInfo) {
          const createdSeason = await tx.season.create({
            data: {
              title: parsedSeasonInfo.title,
              release_date: parsedSeasonInfo.release_date,
              season_thumbnail: seasonThumbnailName,
              series: { connect: { id: createdSeries.id } },
            },
          });
          seasonId = createdSeason.id;
        }

        for (const episode of parsedEpisodes) {
          const files = uploadedEpisodeFiles.get(episode.key);
          if (!files?.video) {
            throw new Error(
              `Video file for episode key "${episode.key}" is missing.`,
            );
          }

          await tx.episode.create({
            data: {
              episode_number: Number(episode.episode_number),
              title: episode.title,
              description: episode.description,
              duration: Number(episode.duration),
              release_date: episode.release_date,
              episode_thumbnails: files?.thumbnail || null,
              episode_videos: files.video,
              series: { connect: { id: createdSeries.id } },
              ...(seasonId && { season: { connect: { id: seasonId } } }),
            },
          });
        }

        return {
          success: true,
          message: 'Series created successfully.',
          data: { id: createdSeries.id, title: createdSeries.title },
        };
      });
    } catch (error) {
      console.error('Failed to create series:', error);
      return {
        success: false,
        message:
          error.message ||
          'An unexpected error occurred while creating the series.',
      };
    }
  }

  // *update series
  async updateSeries(
    id: string,
    dto: UpdateSeriesDto,
    files: Express.Multer.File[],
  ) {
    try {
      const existingSeries = await this.prisma.series.findUnique({
        where: { id },
        include: {
          casts: true,
          episodes: true,
          seasons: true,
        },
      });

      if (!existingSeries) {
        return { success: false, message: 'Series not found' };
      }

      // -------------------------------
      // PARSE JSON FIELDS
      // -------------------------------
      const parsedCast = dto.cast ? JSON.parse(dto.cast) : [];
      const parsedEpisodes = dto.episodes ? JSON.parse(dto.episodes) : [];
      const parsedSeasonInfo = dto.season_info
        ? JSON.parse(dto.season_info)
        : null;

      // -------------------------------
      // MAP FILES
      // -------------------------------
      const seriesThumbnailFile = files.find(
        (f) => f.fieldname === 'series_thumbnail',
      );
      const seriesTrailerFile = files.find(
        (f) => f.fieldname === 'series_trailer',
      );
      const directorThumbnailFile = files.find(
        (f) => f.fieldname === 'director_thumbnail',
      );
      const seasonThumbnailFile = files.find(
        (f) => f.fieldname === 'season_thumbnail',
      );

      const castThumbnailsMap = new Map<string, Express.Multer.File>();
      const episodeFilesMap = new Map<
        string,
        { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
      >();

      for (const file of files) {
        const { fieldname } = file;

        if (fieldname.startsWith('cast_')) {
          const key = fieldname.replace('cast_', '');
          castThumbnailsMap.set(key, file);
        }

        // episode_key_thumbnail or episode_key_video
        if (fieldname.startsWith('episode_')) {
          const parts = fieldname.split('_');
          const key = parts[1];
          const type = parts[2] as 'thumbnail' | 'video';

          if (!episodeFilesMap.has(key)) {
            episodeFilesMap.set(key, {});
          }
          episodeFilesMap.get(key)![type] = file;
        }
      }

      // -------------------------------
      // FILE UPLOADS
      // -------------------------------
      const uploadedCastThumbnails = new Map<string, string>();

      for (const [castId, file] of castThumbnailsMap.entries()) {
        const fileName = `${StringHelper.randomString()}_${file.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.cast}/${fileName}`,
          file.buffer,
        );
        uploadedCastThumbnails.set(castId, fileName);
      }

      const uploadedEpisodeFiles = new Map<
        string,
        { thumbnail?: string; video?: string }
      >();

      for (const [key, pair] of episodeFilesMap.entries()) {
        const uploaded: { thumbnail?: string; video?: string } = {};

        if (pair.thumbnail) {
          const n = `${StringHelper.randomString()}_${pair.thumbnail.originalname}`;
          await SojebStorage.put(
            `${appConfig().storageUrl.episode}/${n}`,
            pair.thumbnail.buffer,
          );
          uploaded.thumbnail = n;
        }
        if (pair.video) {
          const n = `${StringHelper.randomString()}_${pair.video.originalname}`;
          await SojebStorage.put(
            `${appConfig().storageUrl.episode}/${n}`,
            pair.video.buffer,
          );
          uploaded.video = n;
        }

        uploadedEpisodeFiles.set(key, uploaded);
      }

      // -------------------------------
      // UPDATE PROCESS (TRANSACTION)
      // -------------------------------
      return await this.prisma.$transaction(async (tx) => {
        // -------------------------------
        // UPDATE SERIES MAIN DATA
        // -------------------------------
        const updatedSeries = await tx.series.update({
          where: { id },
          data: {
            title: dto.title ?? existingSeries.title,
            description: dto.description ?? existingSeries.description,
            kids_mode: dto.kids_mode ?? existingSeries.kids_mode,
            release_date: dto.release_date ?? existingSeries.release_date,
            status: dto.status ?? existingSeries.status,
            genres: dto.genres ?? existingSeries.genres,

            ...(dto.category_id && {
              category: { connect: { id: dto.category_id } },
            }),

            ...(seriesThumbnailFile && {
              series_thumbnail: `${StringHelper.randomString()}_${seriesThumbnailFile.originalname}`,
            }),

            ...(seriesTrailerFile && {
              series_trailer: `${StringHelper.randomString()}_${seriesTrailerFile.originalname}`,
            }),

            ...(directorThumbnailFile && {
              director_thumbnail: `${StringHelper.randomString()}_${directorThumbnailFile.originalname}`,
            }),
          },
        });

        // -------------------------------
        // CAST UPDATE
        // -------------------------------
        const castDeleteIds = dto.cast_delete_ids || [];

        if (castDeleteIds.length > 0) {
          await tx.cast.deleteMany({
            where: { id: { in: castDeleteIds } },
          });
        }

        for (const cast of parsedCast) {
          if (cast.id) {
            // UPDATE EXISTING CAST
            await tx.cast.update({
              where: { id: cast.id },
              data: {
                name: cast.name,
                description: cast.description,
                ...(uploadedCastThumbnails.get(cast.id) && {
                  cast_thumbnail: uploadedCastThumbnails.get(cast.id),
                }),
              },
            });
          } else {
            // NEW CAST
            await tx.cast.create({
              data: {
                name: cast.name,
                description: cast.description,
                cast_thumbnail: uploadedCastThumbnails.get(cast.key) ?? null,
                series: { connect: { id } },
              },
            });
          }
        }

        // -------------------------------
        // SEASON UPDATE
        // -------------------------------
        if (parsedSeasonInfo) {
          let season = existingSeries.seasons[0];

          if (!season) {
            season = await tx.season.create({
              data: {
                title: parsedSeasonInfo.title,
                release_date: parsedSeasonInfo.release_date,
                ...(seasonThumbnailFile && {
                  season_thumbnail: `${StringHelper.randomString()}_${seasonThumbnailFile.originalname}`,
                }),
                series: { connect: { id } },
              },
            });
          } else {
            await tx.season.update({
              where: { id: season.id },
              data: {
                title: parsedSeasonInfo.title,
                release_date: parsedSeasonInfo.release_date,
                ...(seasonThumbnailFile && {
                  season_thumbnail: `${StringHelper.randomString()}_${seasonThumbnailFile.originalname}`,
                }),
              },
            });
          }
        }

        // -------------------------------
        // EPISODE UPDATE
        // -------------------------------
        const episodeDeleteIds = dto.episode_delete_ids || [];

        if (episodeDeleteIds.length > 0) {
          await tx.episode.deleteMany({
            where: { id: { in: episodeDeleteIds } },
          });
        }

        for (const ep of parsedEpisodes) {
          const files = uploadedEpisodeFiles.get(ep.key);

          if (ep.id) {
            // UPDATE EXISTING EPISODE
            await tx.episode.update({
              where: { id: ep.id },
              data: {
                title: ep.title,
                episode_number: Number(ep.episode_number),
                description: ep.description,
                duration: Number(ep.duration),
                release_date: ep.release_date,
                ...(files?.thumbnail && {
                  episode_thumbnails: files.thumbnail,
                }),
                ...(files?.video && {
                  episode_videos: files.video,
                }),
              },
            });
          } else {
            // NEW EPISODE
            await tx.episode.create({
              data: {
                title: ep.title,
                episode_number: Number(ep.episode_number),
                description: ep.description,
                duration: Number(ep.duration),
                release_date: ep.release_date,
                episode_thumbnails: files?.thumbnail ?? null,
                episode_videos: files?.video ?? null,
                series: { connect: { id } },
              },
            });
          }
        }

        return {
          success: true,
          message: 'Series updated successfully.',
        };
      });
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message || 'Failed to update series',
      };
    }
  }

  // *get all series
  async getAllSeries() {
    const seriesList = await this.prisma.series.findMany({
      include: {
        category: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return {
      success: true,
      message: 'Series fetched successfully',
      data: seriesList,
    };
  }
  // *delete a series
  async deleteSeries(id: string) {
    try {
      const series = await this.prisma.series.findUnique({
        where: { id },
        include: {
          casts: true,
          seasons: {
            include: {
              episodes: true,
            },
          },
        },
      });

      if (!series) {
        return {
          success: false,
          message: 'Series not found.',
        };
      }

      // ---------------------------
      // DELETE FILES FROM STORAGE
      // ---------------------------

      // 1. Series Thumbnail
      if (series.series_thumbnail) {
        await SojebStorage.delete(
          `${appConfig().storageUrl.series}/${series.series_thumbnail}`,
        );
      }

      // 2. Series Trailer
      if (series.series_trailer) {
        await SojebStorage.delete(
          `${appConfig().storageUrl.series}/${series.series_trailer}`,
        );
      }

      // 3. Director Thumbnail
      if (series.director_thumbnail) {
        await SojebStorage.delete(
          `${appConfig().storageUrl.series_director}/${series.director_thumbnail}`,
        );
      }

      // 4. Cast thumbnails
      for (const cast of series.casts) {
        if (cast.cast_thumbnail) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.cast}/${cast.cast_thumbnail}`,
          );
        }
      }

      // 5. Season thumbnails + Episode files
      for (const season of series.seasons) {
        if (season.season_thumbnail) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.season}/${season.season_thumbnail}`,
          );
        }

        for (const episode of season.episodes) {
          if (episode.episode_thumbnails) {
            await SojebStorage.delete(
              `${appConfig().storageUrl.episode}/${episode.episode_thumbnails}`,
            );
          }
          if (episode.episode_videos) {
            await SojebStorage.delete(
              `${appConfig().storageUrl.episode}/${episode.episode_videos}`,
            );
          }
        }
      }

      // ---------------------------
      // DELETE DB RECORD
      // ---------------------------
      await this.prisma.series.delete({ where: { id } });

      return {
        success: true,
        message: 'Series and all files deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to delete series.',
      };
    }
  }

  // Add new season by seriesId
  async createSeasonAndEpisodes(
    seriesId: string,
    parsedSeasonInfo: any,
    parsedEpisodes: any[],
    seasonThumbnailFile: Express.Multer.File,
    episodeFilesMap: Map<
      string,
      { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
    >,
  ) {
    try {
      // 1. Verify the parent series exists
      const series = await this.prisma.series.findUnique({
        where: { id: seriesId },
      });
      if (!series) {
        return {
          success: false,
          message: `Series with ID "${seriesId}" not found.`,
        };
      }

      // 3. Upload Season Thumbnail
      const seasonThumbnailName = `${StringHelper.randomString()}_${seasonThumbnailFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.season}/${seasonThumbnailName}`,
        seasonThumbnailFile.buffer,
        // mimetype argument removed to fix TS2554 error
      );

      // 4. Upload Episode Files
      const uploadedEpisodeFiles = new Map<
        string,
        { thumbnail?: string; video?: string }
      >();
      for (const [key, filePair] of episodeFilesMap.entries()) {
        const uploadedPair: { thumbnail?: string; video?: string } = {};

        // Upload Episode Thumbnail
        if (filePair.thumbnail) {
          const thumbName = `${StringHelper.randomString()}_${filePair.thumbnail.originalname}`;
          await SojebStorage.put(
            `${appConfig().storageUrl.episode}/${thumbName}`,
            filePair.thumbnail.buffer,
            // mimetype argument removed
          );
          uploadedPair.thumbnail = thumbName;
        }

        // Upload Episode Video
        if (filePair.video) {
          const videoName = `${StringHelper.randomString()}_${filePair.video.originalname}`;
          await SojebStorage.put(
            `${appConfig().storageUrl.episode}/${videoName}`,
            filePair.video.buffer,
            // mimetype argument removed
          );
          uploadedPair.video = videoName;
        }
        uploadedEpisodeFiles.set(key, uploadedPair);
      }

      // 5. Database Transaction
      return await this.prisma.$transaction(async (tx) => {
        // A. Create the new Season record
        const createdSeason = await tx.season.create({
          data: {
            title: parsedSeasonInfo.title,
            release_date: parsedSeasonInfo.release_date,
            season_thumbnail: seasonThumbnailName,
            // Connect to the existing series
            series: { connect: { id: seriesId } },
          },
        });
        const seasonId = createdSeason.id;

        // B. Create Episode records
        for (const episode of parsedEpisodes) {
          const files = uploadedEpisodeFiles.get(episode.key);

          if (!files?.video) {
            throw new Error(
              `Video file for episode key "${episode.key}" is missing.`,
            );
          }

          await tx.episode.create({
            data: {
              // Now using the unique sequential number instead of the DTO's episode_number
              episode_number: episode.episode_number,
              title: episode.title,
              description: episode.description,
              duration: Number(episode.duration),
              release_date: episode.release_date,
              episode_thumbnails: files?.thumbnail || null,
              episode_videos: files.video,

              // Connect to both the new season and the parent series
              series: { connect: { id: seriesId } },
              season: { connect: { id: seasonId } },
            },
          });
        }

        return {
          success: true,
          message: `Season "${createdSeason.title}" and ${parsedEpisodes.length} episodes added successfully to series ID ${seriesId}.`,
          data: { seriesId: seriesId, seasonId: seasonId },
        };
      });
    } catch (error) {
      console.error('Error in createSeasonAndEpisodes:', error);
      // Ensure the error response clearly shows the original Prisma error message if available
      return {
        success: false,
        message:
          error.message ||
          'An unexpected error occurred while adding season and episodes.',
      };
    }
  }

  // Add new episodes under series/season with seriesId/seasonId
  async addEpisodesToContainer(
    seriesId: string | undefined,
    seasonId: string | undefined,
    parsedEpisodes: any[],
    episodeFilesMap: Map<
      string,
      { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
    >,
  ) {
    let finalSeriesId: string;
    let finalSeasonId: string | null = null;
    let seriesTitle: string;
    try {
      if (seasonId) {
        const season = await this.prisma.season.findUnique({
          where: { id: seasonId },
          select: { series_id: true, series: { select: { title: true } } },
        });

        if (!season) {
          return {
            success: false,
            message: `Season with ID "${seasonId}" not found.`,
          };
        }
        finalSeriesId = season.series_id;
        finalSeasonId = seasonId;
        seriesTitle = season.series.title;
      } else if (seriesId) {
        // If only seriesId is provided, use it and try to find the latest season
        const series = await this.prisma.series.findUnique({
          where: { id: seriesId },
          select: { id: true, title: true },
        });
        if (!series) {
          return {
            success: false,
            message: `Series with ID "${seriesId}" not found.`,
          };
        }
        finalSeriesId = series.id;
        seriesTitle = series.title;

        // Try to find the latest existing season to connect the episodes to
        const latestSeason = await this.prisma.season.findFirst({
          where: { series_id: finalSeriesId },
          orderBy: { created_at: 'desc' },
          select: { id: true },
        });
        finalSeasonId = latestSeason?.id || null; // If no season exists, it remains null
      } else {
        // Should be caught by controller validation, but safety check here
        return { success: false, message: 'Missing Series or Season ID.' };
      }
    } catch (error) {
      console.error('ID Resolution Error:', error);
      return {
        success: false,
        message: 'Failed to resolve Series/Season IDs.',
      };
    }

    const uploadedEpisodeFiles = new Map<
      string,
      { thumbnail?: string; video?: string }
    >();
    for (const [key, filePair] of episodeFilesMap.entries()) {
      const uploadedPair: { thumbnail?: string; video?: string } = {};

      // Upload Episode Thumbnail
      if (filePair.thumbnail) {
        const thumbName = `${StringHelper.randomString()}_${filePair.thumbnail.originalname}`;
        // Removed mimetype argument to fix TS2554 error, assuming SojebStorage is updated elsewhere
        await SojebStorage.put(
          `${appConfig().storageUrl.episode}/${thumbName}`,
          filePair.thumbnail.buffer,
        );
        uploadedPair.thumbnail = thumbName;
      }

      // Upload Episode Video
      if (filePair.video) {
        const videoName = `${StringHelper.randomString()}_${filePair.video.originalname}`;
        // Removed mimetype argument to fix TS2554 error, assuming SojebStorage is updated elsewhere
        await SojebStorage.put(
          `${appConfig().storageUrl.episode}/${videoName}`,
          filePair.video.buffer,
        );
        uploadedPair.video = videoName;
      }
      uploadedEpisodeFiles.set(key, uploadedPair);
    }

    // 4. Database Transaction
    return await this.prisma
      .$transaction(async (tx) => {
        let episodesAdded = 0;

        for (const episode of parsedEpisodes) {
          const files = uploadedEpisodeFiles.get(episode.key);

          if (!files?.video) {
            throw new Error(
              `Video file for episode key "${episode.key}" is missing.`,
            );
          }

          await tx.episode.create({
            data: {
              episode_number: episode.episode_number,
              title: episode.title,
              description: episode.description,
              duration: Number(episode.duration),
              release_date: episode.release_date,
              episode_thumbnails: files?.thumbnail || null,
              episode_videos: files.video,

              // Connect to the determined Series
              series: { connect: { id: finalSeriesId } },

              // Connect to the determined Season (if a season ID was found/provided)
              ...(finalSeasonId && {
                season: { connect: { id: finalSeasonId } },
              }),
            },
          });
          episodesAdded++;
        }

        return {
          success: true,
          message: `${episodesAdded} episodes added successfully to series "${seriesTitle}" (Season ID: ${finalSeasonId || 'N/A'}).`,
          data: { seriesId: finalSeriesId, seasonId: finalSeasonId },
        };
      })
      .catch((error) => {
        // Catch transaction error
        console.error('Transaction failed during episode addition:', error);
        return {
          success: false,
          message: `Database operation failed: ${error.message || 'Check logs for details.'}`,
        };
      });
  }

  //Delete a season
  async deleteASesoan(id: string) {
    try {
      const seasonToDelete = await this.prisma.season.findUnique({
        where: { id },
        include: {
          episodes: {
            select: {
              episode_thumbnails: true,
              episode_videos: true,
            },
          },
        },
      });

      console.log(seasonToDelete);

      if (!seasonToDelete) {
        return {
          success: false,
          message: `Season with ID "${id}" not found.`,
        };
      }

      //Collect all file names to delete from storage
      const filesToDelete: { path: string; name: string }[] = [];

      // Add Season Thumbnail
      if (seasonToDelete.season_thumbnail) {
        filesToDelete.push({
          path: appConfig().storageUrl.season,
          name: seasonToDelete.season_thumbnail,
        });
      }

      // Add Episode files (Thumbnails and Videos)
      for (const episode of seasonToDelete.episodes) {
        if (episode.episode_videos) {
          filesToDelete.push({
            path: appConfig().storageUrl.episode,
            name: episode.episode_videos,
          });
        }
        if (episode.episode_thumbnails) {
          filesToDelete.push({
            path: appConfig().storageUrl.episode,
            name: episode.episode_thumbnails,
          });
        }
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.season.delete({ where: { id } });

        const deleteResults = await Promise.allSettled(
          filesToDelete.map((file) =>
            SojebStorage.delete(`${file.path}/${file.name}`),
          ),
        );

        const failedDeletions = deleteResults.filter(
          (r) => r.status === 'rejected',
        );
        if (failedDeletions.length > 0) {
          console.warn(
            `Warning: ${failedDeletions.length} files failed to delete from storage.`,
            failedDeletions,
          );
        }
      });

      return {
        success: true,
        message: `Season "${seasonToDelete.title}" and ${seasonToDelete.episodes.length} episodes deleted successfully.`,
      };
    } catch (error) {
      console.error('Error deleting season and episodes:', error);

      return {
        success: false,
        message:
          'Failed to delete this season due to an unexpected database or storage error.',
      };
    }
  }

  //Delete a episode
  async deleteAEpisode(id: string) {
    try {
      const episodeToDelete = await this.prisma.episode.findUnique({
        where: { id },
        select: {
          title: true,
          episode_thumbnails: true,
          episode_videos: true,
        },
      });

      if (!episodeToDelete) {
        return {
          success: false,
          message: `Episode with ID "${id}" not found.`,
        };
      }

      const filesToDelete: { path: string; name: string }[] = [];

      // Add Episode Video file
      if (episodeToDelete.episode_videos) {
        filesToDelete.push({
          path: appConfig().storageUrl.episode,
          name: episodeToDelete.episode_videos,
        });
      }

      // Add Episode Thumbnail file
      if (episodeToDelete.episode_thumbnails) {
        filesToDelete.push({
          path: appConfig().storageUrl.episode,
          name: episodeToDelete.episode_thumbnails,
        });
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.episode.delete({ where: { id } });

        const deleteResults = await Promise.allSettled(
          filesToDelete.map((file) =>
            SojebStorage.delete(`${file.path}/${file.name}`),
          ),
        );

        const failedDeletions = deleteResults.filter(
          (r) => r.status === 'rejected',
        );
        if (failedDeletions.length > 0) {
          console.warn(
            `Warning: ${failedDeletions.length} files failed to delete from storage for episode ID ${id}.`,
          );
        }
      });

      return {
        success: true,
        message: `Episode "${episodeToDelete.title}" deleted successfully.`,
      };
    } catch (error) {
      console.error('Error deleting episode:', error);

      return {
        success: false,
        message:
          'Failed to delete this episode due to an unexpected database or storage error.',
      };
    }
  }

  // Get a series all details by seriesId
  async getASeries(id: string) {
    try {
      const series = await this.prisma.series.findUnique({
        where: { id },
        include: {
          category: true,
          casts: true,
          likeComents: true,
          favorites: true,
          seasons: {
            orderBy: { created_at: 'asc' },
            include: {
              episodes: {
                orderBy: { episode_number: 'asc' },
              },
            },
          },
        },
      });

      if (!series) {
        return {
          success: false,
          message: `Series with ID "${id}" not found.`,
        };
      }

      // Format all file names to complete URLs
      const formattedData = this.formatSeriesMedia(series);

      return {
        success: true,
        message: 'Series retrieved successfully',
        data: formattedData,
      };
    } catch (error) {
      console.error('Error fetching series details:', error);
      return {
        success: false,
        message: 'Failed to fetch this series due to an unexpected error.',
      };
    }
  }

  // Private format series service
  private formatSeriesMedia(series: any): any {
    const config = appConfig();
    const formattedSeries = { ...series };

    //Series/Trailer Thumbnails
    if (formattedSeries.series_thumbnail) {
      formattedSeries.series_thumbnail = SojebStorage.url(
        `${config.storageUrl.series}/${formattedSeries.series_thumbnail}`,
      );
    }
    if (formattedSeries.series_trailer) {
      formattedSeries.series_trailer = SojebStorage.url(
        `${config.storageUrl.series}/${formattedSeries.series_trailer}`,
      );
    }

    //Director Thumbnail
    if (formattedSeries.director_thumbnail) {
      formattedSeries.director_thumbnail = SojebStorage.url(
        `${config.storageUrl.series_director}/${formattedSeries.director_thumbnail}`,
      );
    }

    // Cast Thumbnails
    if (formattedSeries.casts) {
      formattedSeries.casts = formattedSeries.casts.map((cast) => ({
        ...cast,
        cast_thumbnail: cast.cast_thumbnail
          ? SojebStorage.url(`${config.storageUrl.cast}/${cast.cast_thumbnail}`)
          : null,
      }));
    }

    // Seasons and Episodes
    if (formattedSeries.seasons) {
      formattedSeries.seasons = formattedSeries.seasons.map((season) => {
        // Season Thumbnail
        if (season.season_thumbnail) {
          season.season_thumbnail = SojebStorage.url(
            `${config.storageUrl.season}/${season.season_thumbnail}`,
          );
        }

        // Episodes
        if (season.episodes) {
          season.episodes = season.episodes.map((episode) => ({
            ...episode,
            episode_videos: episode.episode_videos
              ? SojebStorage.url(
                  `${config.storageUrl.episode}/${episode.episode_videos}`,
                )
              : null,
            episode_thumbnails: episode.episode_thumbnails
              ? SojebStorage.url(
                  `${config.storageUrl.episode}/${episode.episode_thumbnails}`,
                )
              : null,
          }));
        }
        return season;
      });
    }

    return formattedSeries;
  }
}
