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
}
