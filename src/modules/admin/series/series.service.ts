import { Injectable } from '@nestjs/common';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StringHelper } from 'src/common/helper/string.helper';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { Prisma } from '@prisma/client';

@Injectable()
export class SeriesService {
  constructor(private prisma: PrismaService) {}

  // create series
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

      return await this.prisma.$transaction(async (tx) => {
        const createdSeries = await tx.series.create({
          data: {
            title: dto.title,
            description: dto.description,
            release_date: dto.release_date,
            status: dto.status,
            categories: dto.categories,
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
            return {
              success: false,
              message: `Video file for episode key "${episode.key}" is missing.`,
            };
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
        message: 'An unexpected error occurred while creating the series.',
      };
    }
  }

  create(createSeriesDto: CreateSeriesDto) {
    return 'This action adds a new series';
  }

  findAll() {
    return `This action returns all series`;
  }

  findOne(id: number) {
    return `This action returns a #${id} series`;
  }

  update(id: number, updateSeriesDto: UpdateSeriesDto) {
    return `This action updates a #${id} series`;
  }

  remove(id: number) {
    return `This action removes a #${id} series`;
  }
}
