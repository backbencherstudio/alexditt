import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FavouriteService } from './favourite.service';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { UpdateFavouriteDto } from './dto/update-favourite.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favourite')
export class FavouriteController {
  constructor(private readonly favouriteService: FavouriteService) {}

  // *Create a new favourite
  @Post()
  async create(@Req() req, @Body() createFavouriteDto: CreateFavouriteDto) {
    const userId = req.user.userId;
    return this.favouriteService.create(createFavouriteDto, userId);
  }

  // *Get all favourites
  @Get()
  async findAll(@Req() req, @Query() category?: string) {
    const userId = req.user.userId;
    return this.favouriteService.findAll(userId, category);
  }
}
