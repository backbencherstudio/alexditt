import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseEnumPipe,
  Query,
  UseGuards,
  BadRequestException,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  Request,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Media')
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // Get recent media
  @Get('recent')
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getRecentMedia(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      const userId = req.user.userId;
      if (page < 1 || limit < 1) {
        return {
          success: false,
          message: 'Page and limit must be positive numbers.',
        };
      }
      return this.mediaService.getRecentMedia(userId, { page, limit });
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching recent media.',
      };
    }
  }

  // trending worldwide
  @Get('trending')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopViewsMedia(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive numbers.');
    }
    const userId = req.user.userId;
    return this.mediaService.getTopViewsMedia(userId, { page, limit });
  }

  // Get media by category
  @Get('category/:id')
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getMediaByCategory(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      const userId = req.user.userId;
      if (page < 1 || limit < 1) {
        return {
          success: false,
          message: 'Page and limit must be positive numbers.',
        };
      }
      return this.mediaService.findMediaByCategory(userId, id, {
        page,
        limit,
      });
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching media by category.',
      };
    }
  }

  // get movie or series details by id
  @Get('movie-series/:id')
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'The ID of the movie',
  })
  async getMediaById(@Req() req, @Param('id') id: string) {
    try {
      const userId = req.user.userId;
      return this.mediaService.findMediaById(userId, id);
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching media details.',
      };
    }
  }

  @Get('movie/watch/:id')
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'The ID of the movie to watch',
  })
  async getMovieWatchUrl(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.mediaService.getMovieWatchUrl(userId, id);
  }

  // watch a episode by episode id
  @Get('episode/watch/:id')
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'The ID of the episode to watch',
  })
  async getEpisodeWatchUrl(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.mediaService.getEpisodeWatchUrl(userId, id);
  }

  // get a season details by id
  @Get('season/:id')
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'The ID of the season',
  })
  async getSeasonById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.mediaService.findSeasonById(userId, id);
  }

  // get an episode details by id
  @Get('episode/:id')
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'The ID of the episode',
  })
  async getEpisodeById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.mediaService.findEpisodeById(userId, id);
  }

  // global search by movie, episode, season, series tile
  @Get('search')
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'The search query string',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchMedia(
    @Req() req: any,
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Search query cannot be empty.');
    }
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive numbers.');
    }
    const userId = req.user.userId;
    return this.mediaService.searchMedia(userId, query, { page, limit });
  }
}
