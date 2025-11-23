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
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateGenreDto } from './dto/create-genre.dto';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ParsedCastMember } from './interface/parse-cast.interface';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@ApiBearerAuth()
@ApiTags('Admin/Movie')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  // create a movie
  @Post('create')
  @UseInterceptors(AnyFilesInterceptor())
  async createAMovie(
    @Body() createMovieDto: CreateMovieDto,
    @Req() req: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const userId = req.user.userId;

      let parsedCast: any[];
      try {
        parsedCast = JSON.parse(createMovieDto.cast);
      } catch (error) {
        return {
          success: false,
          message: 'Invalid cast format. Must be a valid JSON string.',
        };
      }

      const movieThumbnailFiles = files.filter(
        (file) => file.fieldname === 'movie_thumbnail',
      );
      const videoFiles = files.filter((file) => file.fieldname === 'video');
      const directorThumbnailFile = files.find(
        (f) => f.fieldname === 'director_thumbnail',
      );
      const movieTrailerFile = files.find(
        (f) => f.fieldname === 'movie_trailer',
      );
      const castThumbnailFiles = files.filter((file) =>
        file.fieldname.startsWith('cast_'),
      );

      if (movieThumbnailFiles.length === 0) {
        return {
          success: false,
          message: 'Movie thumbnail is required.',
        };
      }
      if (movieThumbnailFiles.length > 1) {
        return {
          success: false,
          message: 'Only one movie thumbnail is allowed.',
        };
      }

      if (videoFiles.length === 0) {
        return {
          success: false,
          message: 'Video file is required.',
        };
      }
      if (videoFiles.length > 1) {
        return {
          success: false,
          message: 'Only one video file is allowed.',
        };
      }

      const MAX_CAST_THUMBNAILS = parsedCast.length;

      if (castThumbnailFiles.length > MAX_CAST_THUMBNAILS) {
        return {
          success: false,
          message: `You provided ${castThumbnailFiles.length} cast thumbnails, but only ${MAX_CAST_THUMBNAILS} cast members were defined.`,
        };
      }

      const movieThumbnailFile = movieThumbnailFiles[0];
      const videoFile = videoFiles[0];
      const castThumbnailsMap = new Map<string, Express.Multer.File>();
      castThumbnailFiles.forEach((file) => {
        castThumbnailsMap.set(file.fieldname, file);
      });

      const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
      if (movieThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: 'Movie thumbnail size should not exceed 10 MB.',
        };
      }

      for (const file of castThumbnailFiles) {
        if (file.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Cast thumbnail '${file.originalname}' size should not exceed 10 MB.`,
          };
        }
      }

      if (castThumbnailFiles.length > parsedCast.length) {
        return {
          success: false,
          message: 'More cast thumbnails provided than cast members.',
        };
      }

      const createAMovie = await this.movieService.createAMovie(
        createMovieDto,
        parsedCast,
        userId,
        movieThumbnailFile,
        movieTrailerFile,
        videoFile,
        castThumbnailsMap,
        directorThumbnailFile,
      );
      return createAMovie;
    } catch (error) {
      console.error(error);
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
