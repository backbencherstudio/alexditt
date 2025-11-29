import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StreamService } from './stream.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiTags('Application - Live TV Stream')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('auth-check')
  @ApiOperation({ summary: 'Check IPTV Server Connection' })
  async checkAuth() {
    try {
      const data = await this.streamService.checkAuthentication();
      return {
        success: true,
        message: 'IPTV Server Connected',
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // note: live tv endpoints

  @Get('categories')
  @ApiOperation({ summary: 'Get Live TV Categories' })
  async getCategories() {
    try {
      const categories = await this.streamService.getCategories();
      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch categories',
      };
    }
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get Channels by Category ID' })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID from categories list',
  })
  async getStreams(@Param('categoryId') categoryId: string) {
    try {
      const streams = await this.streamService.getStreamsByCategory(categoryId);
      return {
        success: true,
        count: streams.length,
        data: streams,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch streams',
      };
    }
  }

  // note: movie (VOD) endpoints

  @Get('movies/categories')
  @ApiOperation({ summary: 'Get All Movie (VOD) Categories' })
  async getMovieCategories() {
    try {
      const categories = await this.streamService.getMovieCategories();
      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch movie categories',
      };
    }
  }

  @Get('movies/category/:categoryId')
  @ApiOperation({ summary: 'Get Movies (VOD) by Category ID' })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID from movie categories list',
  })
  async getMovies(@Param('categoryId') categoryId: string) {
    try {
      const movies = await this.streamService.getMoviesByCategory(categoryId);
      return {
        success: true,
        count: movies.length,
        data: movies,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch movies',
      };
    }
  }

  // note:series

  // * get Series Categories
  @Get('series/categories')
  @ApiOperation({ summary: 'Get All Series Categories' })
  async getSeriesCategories() {
    try {
      const categories = await this.streamService.getSeriesCategories();
      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch series categories',
      };
    }
  }

  // * get Series by Category ID
  @Get('series/category/:categoryId')
  @ApiOperation({ summary: 'Get Series by Category ID' })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID from series categories list',
  })
  async getSeriesByCategory(@Param('categoryId') categoryId: string) {
    try {
      const series = await this.streamService.getSeries(categoryId);
      return {
        success: true,
        count: series.length,
        data: series,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch series',
      };
    }
  }

  // * get All Series
  @Get('series/info/:seriesId')
  @ApiOperation({ summary: 'Get Full Series Info (Seasons & Episodes)' })
  @ApiParam({
    name: 'seriesId',
    description: 'Series ID from the series list',
  })
  async getSeriesInfo(@Param('seriesId') seriesId: string) {
    try {
      const seriesInfo = await this.streamService.getSeriesInfo(seriesId);
      return {
        success: true,
        data: seriesInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch series info',
      };
    }
  }

  
}
