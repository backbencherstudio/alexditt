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

  // create A Genre
  async createAGenre(createGenreDto: CreateGenreDto) {
    const { name } = createGenreDto;

    const existingGenre = await this.prisma.genre.findUnique({
      where: { name },
    });

    if (existingGenre) {
      return {
        success: false,
        message: 'Genre already exists.',
      };
    }

    try {
      return await this.prisma.genre.create({
        data: { name },
      });
    } catch (error) {
      return {
        seccess: false,
        message: 'Failed to create genre.',
      };
    }
  }

  // find all genres
  async findAllGenre() {
    return this.prisma.genre.findMany();
  }

  // create movie
  async createAMovie(
    dto: CreateMovieDto,
    parsedCast: any[],
    userId: string,
    movieThumbnailFile: Express.Multer.File,
    videoFile: Express.Multer.File,
    castThumbnailsMap: Map<string, Express.Multer.File>,
  ) {
    try {
      const movieThumbnailFileName = `${StringHelper.randomString()}_${movieThumbnailFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.movie}/${movieThumbnailFileName}`,
        movieThumbnailFile.buffer,
      );

      const videoFileName = `${StringHelper.randomString()}_${videoFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.movie}/${videoFileName}`,
        videoFile.buffer,
      );

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
        const genreConnect = dto.genreIds.map((id) => ({ id }));

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
            release_date: dto.release_date,
            duration: dto.duration,
            movie_thumbnail: movieThumbnailFileName,
            video: videoFileName,
            user: {
              connect: { id: userId },
            },
            genres: {
              connect: genreConnect,
            },
            casts: {
              create: castCreateData,
            },
          },
          include: {
            genres: true,
            casts: true,
            user: true,
          },
        });

        return movie;
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
