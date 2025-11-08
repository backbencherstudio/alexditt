import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';

@ApiBearerAuth()
@ApiTags('Admin/Series')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  // create a series
  @Post('create')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async createASeries(
    @Body() dto: CreateSeriesDto,
    @Req() req: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      const userId = req.user.userId;

      const parsedCast = dto.cast ? JSON.parse(dto.cast) : [];
      const parsedEpisodes = JSON.parse(dto.episodes);
      const parsedSeasonInfo = dto.season_info
        ? JSON.parse(dto.season_info)
        : null;

      if (!parsedEpisodes || parsedEpisodes.length === 0) {
        return {
          success: false,
          message: 'At least one episode is required.',
        };
      }

      const seriesThumbnailFile = files.find(
        (f) => f.fieldname === 'series_thumbnail',
      );
      if (!seriesThumbnailFile) {
        return {
          success: false,
          message: 'Series thumbnail is required.',
        };
      }

      const seriesTrailerFile = files.find(
        (f) => f.fieldname === 'series_trailer',
      );
      const directorThumbnailFile = files.find(
        (f) => f.fieldname === 'director_thumbnail',
      );
      const seasonThumbnailFile = files.find(
        (f) => f.fieldname === 'season_thumbnail',
      );

      if (parsedSeasonInfo && !seasonThumbnailFile) {
        return {
          success: false,
          message: 'Season thumbnail is required when season info is provided.',
        };
      }

      const castThumbnailsMap = new Map<string, Express.Multer.File>();
      const episodeFilesMap = new Map<
        string,
        { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
      >();

      for (const file of files) {
        const { fieldname } = file;
        if (fieldname.startsWith('cast_')) {
          castThumbnailsMap.set(fieldname, file);
        } else if (fieldname.startsWith('episode_')) {
          const parts = fieldname.split('_');
          const key = parts[1];
          const type = parts[2] as 'thumbnail' | 'video';

          if (!episodeFilesMap.has(key)) {
            episodeFilesMap.set(key, {});
          }
          const pair = episodeFilesMap.get(key);
          if (pair) pair[type] = file;
        }
      }

      const result = await this.seriesService.createASeries(
        dto,
        userId,
        parsedCast,
        parsedEpisodes,
        parsedSeasonInfo,
        seriesThumbnailFile,
        seriesTrailerFile,
        directorThumbnailFile,
        seasonThumbnailFile,
        castThumbnailsMap,
        episodeFilesMap,
      );

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while creating the series.',
      };
    }
  }
}
