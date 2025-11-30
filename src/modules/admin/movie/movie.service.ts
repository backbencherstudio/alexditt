import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  // *create movie
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

  // *update movie
  async update(id: string, dto: UpdateMovieDto, files: Express.Multer.File[]) {
    try {
      // ---------------------------------------
      // LOAD EXISTING MOVIE
      // ---------------------------------------
      const existingMovie = await this.prisma.movie.findUnique({
        where: { id },
        include: { casts: true },
      });

      if (!existingMovie) {
        throw new NotFoundException('Movie not found');
      }

      // ---------------------------------------
      // FILE EXTRACTION
      // ---------------------------------------
      const movieThumbnail = files.find((f) => f.fieldname === 'movie_thumbnail');
      const movieTrailer = files.find((f) => f.fieldname === 'movie_trailer');
      const videoFile = files.find((f) => f.fieldname === 'video');
      const directorThumb = files.find((f) => f.fieldname === 'director_thumbnail');
      const castThumbFiles = files.filter((f) => f.fieldname.startsWith('cast_'));

      // ---------------------------------------
      // PARSE CAST JSON (OPTIONAL)
      // ---------------------------------------
      let parsedCast = [];
      if (dto.cast) {
        try {
          parsedCast = JSON.parse(dto.cast);
        } catch {
          throw new BadRequestException('Invalid cast JSON format');
        }
      }

      // ---------------------------------------
      // DELETE SPECIFIC CAST RECORDS + OLD FILES
      // ---------------------------------------
      if (dto.cast_delete_ids && dto.cast_delete_ids.length > 0) {
        const deleteCasts = existingMovie.casts.filter((c) =>
          dto.cast_delete_ids.includes(c.id),
        );

        for (const c of deleteCasts) {
          if (c.cast_thumbnail) {
            await SojebStorage.delete(
              `${appConfig().storageUrl.cast}/${c.cast_thumbnail}`,
            );
          }
        }

        await this.prisma.cast.deleteMany({
          where: {
            id: { in: dto.cast_delete_ids },
            movie_id: id,
          },
        });
      }

      // ---------------------------------------
      // UPDATE MOVIE MAIN FILES + DELETE OLD
      // ---------------------------------------

      // MOVIE THUMBNAIL
      let movieThumbnailName = existingMovie.movie_thumbnail;
      if (movieThumbnail) {
        if (existingMovie.movie_thumbnail) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.movie}/${existingMovie.movie_thumbnail}`,
          );
        }

        movieThumbnailName =
          StringHelper.randomString() + '_' + movieThumbnail.originalname;

        await SojebStorage.put(
          `${appConfig().storageUrl.movie}/${movieThumbnailName}`,
          movieThumbnail.buffer,
        );
      }

      // MOVIE TRAILER
      let movieTrailerName = existingMovie.movie_trailer;
      if (movieTrailer) {
        if (existingMovie.movie_trailer) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.movie}/${existingMovie.movie_trailer}`,
          );
        }

        movieTrailerName =
          StringHelper.randomString() + '_' + movieTrailer.originalname;

        await SojebStorage.put(
          `${appConfig().storageUrl.movie}/${movieTrailerName}`,
          movieTrailer.buffer,
        );
      }

      // MOVIE VIDEO
      let videoFileName = existingMovie.video;
      if (videoFile) {
        if (existingMovie.video) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.movie}/${existingMovie.video}`,
          );
        }

        videoFileName =
          StringHelper.randomString() + '_' + videoFile.originalname;

        await SojebStorage.put(
          `${appConfig().storageUrl.movie}/${videoFileName}`,
          videoFile.buffer,
        );
      }

      // DIRECTOR THUMBNAIL
      let directorThumbName = existingMovie.director_thumbnail;
      if (directorThumb) {
        if (existingMovie.director_thumbnail) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.movie_director}/${existingMovie.director_thumbnail}`,
          );
        }

        directorThumbName =
          StringHelper.randomString() + '_' + directorThumb.originalname;

        await SojebStorage.put(
          `${appConfig().storageUrl.movie_director}/${directorThumbName}`,
          directorThumb.buffer,
        );
      }

      // ---------------------------------------
      // CAST THUMBNAILS UPDATE
      // ---------------------------------------

      const uploadedCastThumbs = new Map<string, string>();

      for (const file of castThumbFiles) {
        // extract index from cast_0
        const index = Number(file.fieldname.split('_')[1]);

        // match old cast by index
        const matchingOldCast = existingMovie.casts[index];

        // delete old thumb if exists
        if (matchingOldCast?.cast_thumbnail) {
          await SojebStorage.delete(
            `${appConfig().storageUrl.cast}/${matchingOldCast.cast_thumbnail}`,
          );
        }

        // upload new
        const newName = StringHelper.randomString() + '_' + file.originalname;

        await SojebStorage.put(
          `${appConfig().storageUrl.cast}/${newName}`,
          file.buffer,
        );

        uploadedCastThumbs.set(file.fieldname, newName);
      }

      // ---------------------------------------
      // NEW CAST INSERT (ONLY ADD, NOT DELETE OLD)
      // ---------------------------------------
      const newCastData =
        parsedCast.length > 0
          ? parsedCast.map((c) => {
              const thumbnail = uploadedCastThumbs.get(c.key) || null;

              return {
                movie_id: id,
                name: c.name,
                description: c.description,
                cast_thumbnail: thumbnail,
              };
            })
          : [];

      // ---------------------------------------
      // SAVE ALL CHANGES
      // ---------------------------------------
      await this.prisma.$transaction(async (tx) => {
        // add new cast
        if (newCastData.length > 0) {
          await tx.cast.createMany({ data: newCastData });
        }

        // update movie main data
        await tx.movie.update({
          where: { id },
          data: {
            title: dto.title ?? existingMovie.title,
            description: dto.description ?? existingMovie.description,
            kids_mode: dto.kids_mode ?? existingMovie.kids_mode,
            release_date: dto.release_date ?? existingMovie.release_date,
            duration: dto.duration ?? existingMovie.duration,
            status: dto.status ?? existingMovie.status,
            director_name: dto.director_name ?? existingMovie.director_name,

            movie_thumbnail: movieThumbnailName,
            movie_trailer: movieTrailerName,
            video: videoFileName,
            director_thumbnail: directorThumbName,

            category_id: dto.category_id ?? existingMovie.category_id,
            genres: dto.genres ?? existingMovie.genres,
          },
        });
      });

      return {
        success: true,
        message: 'Movie updated successfully',
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: 'Failed to update movie',
      };
    }
  }

  // *get all movies
  async getAll() {
    const movies = await this.prisma.movie.findMany({
      include: {
        casts: true,
        category: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Movies fetched successfully',
      data: movies,
    };
  }

  // *get movie by id
  async getOne(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        casts: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        likeComents: {
          select: {
            is_like: true,
            is_dislike: true,
            is_favorite: true,
            comment_text: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

  
    const getUrl = (path: string, fileName: string | null) => {
      return fileName ? SojebStorage.url(`${path}/${fileName}`) : null;
    };

   
    const movieThumbnailUrl = getUrl(
      appConfig().storageUrl.movie,
      movie.movie_thumbnail,
    );
    const movieTrailerUrl = getUrl(
      appConfig().storageUrl.movie,
      movie.movie_trailer,
    );
    const videoUrl = getUrl(appConfig().storageUrl.movie, movie.video);
    const directorThumbnailUrl = getUrl(
      appConfig().storageUrl.movie_director,
      movie.director_thumbnail,
    );

   
    const castsWithUrls = movie.casts.map((cast) => ({
      ...cast,
      cast_thumbnail_url: getUrl(
        appConfig().storageUrl.cast,
        cast.cast_thumbnail,
      ),
    }));

    
    const formattedMovie = {
      ...movie,

     
      movie_thumbnail_url: movieThumbnailUrl,
      movie_trailer_url: movieTrailerUrl,
      video_url: videoUrl,
      director_thumbnail_url: directorThumbnailUrl,

      casts: castsWithUrls, 
    };

    return {
      success: true,
      message: 'Movie fetched successfully',
      data: formattedMovie,
    };
  }

  // *get delete movies
  async delete(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: { casts: true },
    });

    if (!movie) throw new NotFoundException('Movie not found');

    // -------------------------------
    // DELETE MOVIE FILES
    // -------------------------------

    if (movie.movie_thumbnail) {
      await SojebStorage.delete(
        `${appConfig().storageUrl.movie}/${movie.movie_thumbnail}`,
      );
    }

    if (movie.movie_trailer) {
      await SojebStorage.delete(
        `${appConfig().storageUrl.movie}/${movie.movie_trailer}`,
      );
    }

    if (movie.video) {
      await SojebStorage.delete(
        `${appConfig().storageUrl.movie}/${movie.video}`,
      );
    }

    if (movie.director_thumbnail) {
      await SojebStorage.delete(
        `${appConfig().storageUrl.movie_director}/${movie.director_thumbnail}`,
      );
    }

    // -------------------------------
    // DELETE CAST FILES
    // -------------------------------
    for (const cast of movie.casts) {
      if (cast.cast_thumbnail) {
        await SojebStorage.delete(
          `${appConfig().storageUrl.cast}/${cast.cast_thumbnail}`,
        );
      }
    }

    // -------------------------------
    // DELETE DATABASE RECORD
    // -------------------------------

    await this.prisma.movie.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Movie deleted successfully',
    };
  }
}
