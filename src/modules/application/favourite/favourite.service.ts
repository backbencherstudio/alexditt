import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { UpdateFavouriteDto } from './dto/update-favourite.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavouriteService {
  constructor(private prisma: PrismaService) {}

  // *Create a new favourite
  async create(dto: CreateFavouriteDto, userId: string) {
    const { movie_id, series_id } = dto;

    if (!movie_id && !series_id) {
      throw new BadRequestException('Either movie_id or series_id is required');
    }

    if (movie_id && series_id) {
      throw new BadRequestException('Send only one: movie_id OR series_id');
    }

    if (movie_id) {
      const movie = await this.prisma.movie.findUnique({
        where: { id: movie_id },
      });
      if (!movie) {
        throw new BadRequestException('Invalid movie_id → movie not found');
      }
    }

    if (series_id) {
      const series = await this.prisma.series.findUnique({
        where: { id: series_id },
      });
      if (!series) {
        throw new BadRequestException('Invalid series_id → series not found');
      }
    }

    const exists = await this.prisma.favorite.findFirst({
      where: {
        user_id: userId,
        movie_id: movie_id || null,
        series_id: series_id || null,
      },
    });

    if (exists) {
      return {
        success: false,
        message: 'Already in favourites',
        data: exists,
      };
    }

    
    const favourite = await this.prisma.favorite.create({
      data: {
        user_id: userId,
        movie_id: movie_id || null,
        series_id: series_id || null,
      },
    });

    return {
      success: true,
      message: 'Favourite added successfully',
      data: favourite,
    };
  }

  // *Get all favourites
  async findAll(userId: string, category?: string) {
    const isAll = !category || category === 'all';

    const favourites = await this.prisma.favorite.findMany({
      where: {
        user_id: userId,
        ...(isAll
          ? {}
          : {
              OR: [
                { movie: { category_id: category } },
                { series: { category_id: category } },
              ],
            }),
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            movie_thumbnail: true,
            release_date: true,
            genres: true,
            category_id: true,
          },
        },
        series: {
          select: {
            id: true,
            title: true,
            series_thumbnail: true,
            release_date: true,
            genres: true,
            category_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = favourites.map((fav) => ({
      id: fav.movie?.id || fav.series?.id,
      type: fav.movie ? 'movie' : 'series',
      title: fav.movie?.title || fav.series?.title,
      thumbnail: fav.movie?.movie_thumbnail || fav.series?.series_thumbnail,
      release_date: fav.movie?.release_date || fav.series?.release_date,
      genres: fav.movie?.genres || fav.series?.genres || [],
      category_id: fav.movie?.category_id || fav.series?.category_id,
    }));

    return {
      success: true,
      message: 'Favourites retrieved successfully',
      data: formatted,
    };
  }

  // *Remove a favourite
  async remove(id: string, userId: string) {
    const favourite = await this.prisma.favorite.findUnique({
      where: { id },
    });
    if (!favourite || favourite.user_id !== userId) {
      throw new BadRequestException('Favourite not found or unauthorized');
    }

    await this.prisma.favorite.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Favourite removed successfully',
    };
  } 

}