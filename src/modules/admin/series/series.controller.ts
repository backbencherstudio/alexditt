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
  Query,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { CreateSeasonEpisodeDto } from './dto/create-season-episode.dto';
import { AddEpisodesDto } from './dto/add-episode.dto';
import appConfig from 'src/config/app.config';

@ApiBearerAuth()
@ApiTags('Admin/Series')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) { }

  // *create a series
  @Post('create')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: appConfig().fileUpload.maxSizeInGbSeries * 1024 * 1024 * 1024 },
    }),
  )
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

      // * Check file sizes
      const IMAGE_MAX_SIZE_BYTES = appConfig().fileUpload.maxImageSizeInMb * 1024 * 1024;

      if (seriesThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: `Series thumbnail size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
        };
      }

      if (directorThumbnailFile && directorThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: `Director thumbnail size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
        };
      }

      if (seasonThumbnailFile && seasonThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: `Season thumbnail size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
        };
      }

      for (const file of castThumbnailsMap.values()) {
        if (file.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Cast thumbnail '${file.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
        }
      }

      for (const pair of episodeFilesMap.values()) {
        if (pair.thumbnail && pair.thumbnail.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Episode thumbnail '${pair.thumbnail.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
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

  //Update an existing Series and its nested data
  @Patch(':seriesId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Update Series details including Nested Data (Seasons, Casts, Episodes)',
  })
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: appConfig().fileUpload.maxSizeInGbSeries * 1024 * 1024 * 1024 },
    }),
  )
  async updateASeries(
    @Param('seriesId') seriesId: string,
    @Body() dto: UpdateSeriesDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // 1. Prepare data
      const castUpdates = dto.cast_updates
        ? JSON.parse(dto.cast_updates)
        : undefined;
      const episodeUpdates = dto.episode_updates
        ? JSON.parse(dto.episode_updates)
        : undefined;
      const seasonUpdates = dto.season_updates
        ? JSON.parse(dto.season_updates)
        : undefined; // ✅ New

      // 2. Separate files
      const seriesThumbnailFile = files.find(
        (f) => f.fieldname === 'series_thumbnail',
      );
      const seriesTrailerFile = files.find(
        (f) => f.fieldname === 'series_trailer',
      );
      const directorThumbnailFile = files.find(
        (f) => f.fieldname === 'director_thumbnail',
      );

      // Map for dynamic updates
      const castThumbnailFiles = files.filter((f) =>
        f.fieldname.startsWith('cast_'),
      );
      const seasonThumbnailFiles = files.filter((f) =>
        f.fieldname.startsWith('season_'),
      ); // ✅ New

      const episodeThumbnailFiles = files.filter((f) =>
        f.fieldname.startsWith('episode_'),
      );

      // * Check file sizes
      const IMAGE_MAX_SIZE_BYTES = appConfig().fileUpload.maxImageSizeInMb * 1024 * 1024;

      if (seriesThumbnailFile && seriesThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: `Series thumbnail size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
        };
      }

      if (directorThumbnailFile && directorThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: `Director thumbnail size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
        };
      }

      for (const file of castThumbnailFiles) {
        if (file.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Cast thumbnail '${file.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
        }
      }

      for (const file of seasonThumbnailFiles) {
        if (file.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Season thumbnail '${file.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
        }
      }

      for (const file of episodeThumbnailFiles) {
        // Only check thumbnails, exclude videos (though filtering by name 'episode_' matches both, we need to be careful)
        // Wait, 'episode_..._thumbnail' vs 'episode_..._video'.
        // The filter above catches all episode files. We should check if it's a thumbnail.
        if (file.fieldname.includes('_thumbnail') && file.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Episode thumbnail '${file.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
        }
      }

      // 3. Call Service
      const result = await this.seriesService.updateASeries(
        seriesId,
        dto,
        castUpdates,
        seasonUpdates, // ✅ Pass season updates
        episodeUpdates,
        seriesThumbnailFile,
        seriesTrailerFile,
        directorThumbnailFile,
        castThumbnailFiles,
        seasonThumbnailFiles, // ✅ Pass season files
        episodeThumbnailFiles,
      );

      return result;
    } catch (error) {
      console.error('Error updating series:', error);
      return {
        success: false,
        message: 'An error occurred while updating the series.',
      };
    }
  }

  // *update a series
  // @Patch(':id')
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(AnyFilesInterceptor())
  // async updateSeries(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateSeriesDto,
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  // ) {
  //   return this.seriesService.updateSeries(id, dto, files);
  // }

  // Add season by seriesId
  @Post(':seriesId/season')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Add a new Season and its Episodes to an existing Series',
  })
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: appConfig().fileUpload.maxSizeInGbSeries * 1024 * 1024 * 1024 },
    }),
  )
  async addSeasonToSeries(
    @Param('seriesId') seriesId: string,
    @Body() dto: CreateSeasonEpisodeDto,
    @Req() req: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // 1. Parse DTO strings
      const parsedEpisodes = JSON.parse(dto.episodes);
      const parsedSeasonInfo = JSON.parse(dto.season_info);

      // 2. Basic Validation
      if (!parsedEpisodes || parsedEpisodes.length === 0) {
        return {
          success: false,
          message: 'At least one episode is required.',
        };
      }

      // 3. File Mapping for Season Thumbnail and Episodes
      const seasonThumbnailFile = files.find(
        (f) => f.fieldname === 'season_thumbnail',
      );
      if (!seasonThumbnailFile) {
        return {
          success: false,
          message: 'Season thumbnail is required.',
        };
      }

      const episodeFilesMap = new Map<
        string,
        { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
      >();

      for (const file of files) {
        const { fieldname } = file;
        if (fieldname.startsWith('episode_')) {
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

      // * Check file sizes
      const IMAGE_MAX_SIZE_BYTES = appConfig().fileUpload.maxImageSizeInMb * 1024 * 1024;

      if (seasonThumbnailFile.size > IMAGE_MAX_SIZE_BYTES) {
        return {
          success: false,
          message: `Season thumbnail size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
        };
      }

      for (const pair of episodeFilesMap.values()) {
        if (pair.thumbnail && pair.thumbnail.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Episode thumbnail '${pair.thumbnail.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
        }
      }

      // 4. Call Service to handle creation and uploads
      const result = await this.seriesService.createSeasonAndEpisodes(
        seriesId,
        parsedSeasonInfo,
        parsedEpisodes,
        seasonThumbnailFile,
        episodeFilesMap,
      );

      return result;
    } catch (error) {
      console.error('Error adding season to series:', error);
      return {
        success: false,
        message: 'An error occurred while adding the season.',
      };
    }
  }

  // Add episodes under series/season by seriesId/seasonId
  @Post('episodes')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add Episodes to an existing Series or Season' })
  @ApiQuery({
    name: 'seriesId',
    description: 'The ID of the series (required if seasonId is absent)',
    required: false,
  })
  @ApiQuery({
    name: 'seasonId',
    description: 'The ID of the season (required if seriesId is absent)',
    required: false,
  })
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: appConfig().fileUpload.maxSizeInGbEpisode * 1024 * 1024 * 1024 },
    }),
  )
  async addEpisodes(
    @Query('seriesId') seriesId: string, // Get seriesId from query
    @Query('seasonId') seasonId: string, // Get seasonId from query
    @Body() dto: AddEpisodesDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    try {
      // 1. Validation for IDs
      if (!seriesId && !seasonId) {
        return {
          success: false,
          message: 'Either seriesId or seasonId must be provided.',
        };
      }

      // 2. Parse DTO strings
      const parsedEpisodes = JSON.parse(dto.episodes);

      // 3. Basic Validation
      if (!parsedEpisodes || parsedEpisodes.length === 0) {
        return {
          success: false,
          message: 'At least one episode is required.',
        };
      }

      // 4. File Mapping for Episodes
      const episodeFilesMap = new Map<
        string,
        { thumbnail?: Express.Multer.File; video?: Express.Multer.File }
      >();

      for (const file of files) {
        const { fieldname } = file;
        if (fieldname.startsWith('episode_')) {
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

      // * Check file sizes
      const IMAGE_MAX_SIZE_BYTES = appConfig().fileUpload.maxImageSizeInMb * 1024 * 1024;

      for (const pair of episodeFilesMap.values()) {
        if (pair.thumbnail && pair.thumbnail.size > IMAGE_MAX_SIZE_BYTES) {
          return {
            success: false,
            message: `Episode thumbnail '${pair.thumbnail.originalname}' size should not exceed ${appConfig().fileUpload.maxImageSizeInMb} MB.`,
          };
        }
      }

      // 5. Call Service
      const result = await this.seriesService.addEpisodesToContainer(
        seriesId,
        seasonId,
        parsedEpisodes,
        episodeFilesMap,
      );

      return result;
    } catch (error) {
      console.error('Error adding episodes:', error);
      return {
        success: false,
        message: 'An error occurred while adding episodes.',
      };
    }
  }

  // *get series details
  @Get()
  async getAllSeries() {
    return this.seriesService.getAllSeries();
  }

  // Delete a season
  @Delete('season/:id')
  async deleteASeson(@Param('id') id: string) {
    return this.seriesService.deleteASesoan(id);
  }

  // Delete a episodes
  @Delete('episode/:id')
  async deleteAEpisode(@Param('id') id: string) {
    return this.seriesService.deleteAEpisode(id);
  }

  // Get season details
  @Get('season/:id')
  async getASeson(@Param('id') id: string) {
    return this.seriesService.getASeson(id);
  }

  // Get episode details
  @Get('episode/:id')
  async getAEpisode(@Param('id') id: string) {
    return this.seriesService.getAEpisode(id);
  }

  // *get series delete
  @Delete(':id')
  async deleteSeries(@Param('id') id: string) {
    return this.seriesService.deleteSeries(id);
  }

  // Get a series details by seriesId
  @Get(':id')
  async getASeries(@Param('id') id: string) {
    return this.seriesService.getASeries(id);
  }
}
