import { Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { StringHelper } from 'src/common/helper/string.helper';
import { ParsedCastMember } from './interface/parse-cast.interface';

@Injectable()
export class MovieService {
  constructor(private prisma: PrismaService) {}

  // create movie
  async createAMovie(
    dto: CreateMovieDto,
    parsedCast: any[],
    userId: string,
    movieThumbnailFile: Express.Multer.File,
    movieTrailerFile: Express.Multer.File | undefined,
    videoFile: Express.Multer.File,
    castThumbnailsMap: Map<string, Express.Multer.File>,
    directorThumbnailFile?: Express.Multer.File,
  ) {
    try {
      const movieThumbnailFileName = `${StringHelper.randomString()}_${movieThumbnailFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.movie}/${movieThumbnailFileName}`,
        movieThumbnailFile.buffer,
      );

      let movieTrailerName: string | null = null;
      if (movieTrailerFile) {
        movieTrailerName = `${StringHelper.randomString()}_${movieTrailerFile.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.movie}/${movieTrailerName}`,
          movieTrailerFile.buffer,
        );
      }

      const videoFileName = `${StringHelper.randomString()}_${videoFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.movie}/${videoFileName}`,
        videoFile.buffer,
      );

      let directorThumbnailFileName: string | null = null;
      if (directorThumbnailFile) {
        directorThumbnailFileName = `${StringHelper.randomString()}_${directorThumbnailFile.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.movie_director}/${directorThumbnailFileName}`,
          directorThumbnailFile.buffer,
        );
      }

      const uploadedCastThumbnails = new Map<string, string>();
      for (const [key, file] of castThumbnailsMap.entries()) {
        const castThumbnailName = `${StringHelper.randomString()}_${file.originalname}`;
        await SojebStorage.put(
          `${appConfig().storageUrl.cast}/${castThumbnailName}`,
          file.buffer,
        );
        uploadedCastThumbnails.set(key, castThumbnailName);
      }

      return await this.prisma.$transaction(async (tx) => {
        const castCreateData = parsedCast.map((castMember) => {
          const thumbnailFileName = uploadedCastThumbnails.get(castMember.key);

          return {
            name: castMember.name,
            description: castMember.description,
            cast_thumbnail: thumbnailFileName || null,
          };
        });

        const movie = await tx.movie.create({
          data: {
            title: dto.title,
            description: dto.description,
            kids_mode: dto.kids_mode,
            release_date: dto.release_date,
            duration: dto.duration,
            director_name: dto.director_name,
            director_thumbnail: directorThumbnailFileName,
            movie_thumbnail: movieThumbnailFileName,
            movie_trailer: movieTrailerName,
            video: videoFileName,
            status: dto.status,

            category: {
              connect: {
                id: dto.category_id,
              },
            },

            genres: dto.genres,
            user: {
              connect: { id: userId },
            },
            casts: {
              create: castCreateData,
            },
          },
        });

        return {
          success: true,
          message: 'Movie created successfully.',
        };
      });
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to create movie.',
      };
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} movie`;
  }

  update(id: number, updateMovieDto: UpdateMovieDto) {
    return `This action updates a #${id} movie`;
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}
