import { Controller, Get, Param, Query } from '@nestjs/common';
import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  /*===============================================
  =             Live TV Stream Endpoints          =
  ===============================================*/

  // Live TV Categories
  @Get('live/categories')
  getLiveCategories(
    @Query('page') page = '1',
    @Query('perPage') perPage = '100',
  ) {
    return this.streamService.getLiveCategories(+page, +perPage);
  }

  // Live TV Streams (All)
  @Get('live/streams')
  getLiveStreams(@Query('page') page = '1', @Query('perPage') perPage = '100') {
    return this.streamService.getLiveStreams(+page, +perPage);
  }

  // Live TV Streams by Category
  @Get('live/streams/:categoryId')
  getLiveStreamsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = '1',
    @Query('perPage') perPage = '100',
  ) {
    return this.streamService.getLiveStreamsByCategory(
      categoryId,
      +page,
      +perPage,
    );
  }

  /*===============================================
  =             VOD Stream Endpoints              =
  ===============================================*/

  // VOD Categories
  @Get('vod/categories')
  getVodCategories(
    @Query('page') page = '1',
    @Query('perPage') perPage = '100',
  ) {
    return this.streamService.getVodCategories(+page, +perPage);
  }

  // VOD Movies
  @Get('vod/movies')
  getVodMovies(@Query('page') page = '1', @Query('perPage') perPage = '100') {
    return this.streamService.getVodMovies(+page, +perPage);
  }

  // VOD Movies by Category
  @Get('vod/movies/:categoryId')
  getVodMoviesByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = '1',
    @Query('perPage') perPage = '100',
  ) {
    return this.streamService.getVodMoviesByCategory(
      categoryId,
      +page,
      +perPage,
    );
  }
}