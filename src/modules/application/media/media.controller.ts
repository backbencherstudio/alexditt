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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      if (page < 1 || limit < 1) {
        return {
          success: false,
          message: 'Page and limit must be positive numbers.',
        };
      }
      return this.mediaService.getRecentMedia({ page, limit });
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching recent media.',
      };
    }
  }

  // Get media by category
  @Get('category/:category')
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
    @Param('category', new ParseEnumPipe(Category)) category: Category,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      if (page < 1 || limit < 1) {
        return {
          success: false,
          message: 'Page and limit must be positive numbers.',
        };
      }
      return this.mediaService.findMediaByCategory(category, { page, limit });
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
  async getMovieById(@Param('id') id: string) {
    return this.mediaService.findMediaById(id);
  }

  @Get('movie/watch/:id')
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'The ID of the movie to watch',
  })
  async getMovieWatchUrl(@Param('id') id: string) {
    return this.mediaService.getMovieWatchUrl(id);
  }
}
