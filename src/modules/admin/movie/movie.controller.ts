import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateGenreDto } from './dto/create-genre.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ParsedCastMember } from './interface/parse-cast.interface';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  // create Genre
  @Post('create/genre')
  async createAGenre(@Body() createGenreDto: CreateGenreDto) {
    try {
      const createAGenre = await this.movieService.createAGenre(createGenreDto);
      return {
        success: true,
        data: createAGenre,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create genre.',
      };
    }
  }

  // get all genres
  @Get('all/genre')
  async findAllGenre() {
    try {
      const genres = await this.movieService.findAllGenre();
      return {
        success: true,
        data: genres,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch genres.',
      };
    }
  }

  @Post('create/movie')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'movie_thumbnail', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'cast_thumbnails', maxCount: 10 },
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  async createAMovie(
    @Body() createMovieDto: CreateMovieDto,
    @Req() req,
    @UploadedFiles()
    files: {
      movie_thumbnail?: Express.Multer.File[];
      video?: Express.Multer.File[];
      cast_thumbnails?: Express.Multer.File[];
    },
  ) {
    try {
      const userId = req.user.id;
      const movieThumbnailFile = files?.movie_thumbnail?.[0];
      const videoFile = files?.video?.[0];
      const castThumbnailFiles = files?.cast_thumbnails || [];

      // --- Validation ---
      if (!movieThumbnailFile) {
        return {
          success: false,
          message: 'Movie thumbnail is required.',
        };
      }
      if (!videoFile) {
        return {
          success: false,
          message: 'Video file is required.',
        };
      }

      // check movie thumbnail size
      const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
      if (movieThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: 'Movie thumbnail size should not exceed 10 MB.',
        };
      }

      // checl cast thumbnails size
      for (const file of castThumbnailFiles) {
        if (file.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: 'Each cast thumbnail size should not exceed 10 MB.',
          };
        }
      }

      let parsedCast: ParsedCastMember[];
      try {
        parsedCast = JSON.parse(createMovieDto.cast);
      } catch (error) {
        return {
          success: false,
          message: 'Invalid cast format. Must be a valid JSON string.',
        };
      }

      if (parsedCast.length !== castThumbnailFiles.length) {
        return {
          success: false,
          message: 'Number of cast members and cast thumbnails do not match.',
        };
      }
      const createAMovie = await this.movieService.create(
        createMovieDto,
        parsedCast,
        userId,
        movieThumbnailFile,
        videoFile,
        castThumbnailFiles,
      );
      return {
        success: true,
        data: createAMovie,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create movie.',
      };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movieService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.movieService.update(+id, updateMovieDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movieService.remove(+id);
  }
}
