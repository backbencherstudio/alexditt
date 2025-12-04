import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { UpdateFavouriteDto } from './dto/update-favourite.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import appConfig from 'src/config/app.config';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';

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

    if (favourites.length === 0) {
      return {
        success: true,
        message: isAll
          ? 'No favourites found'
          : 'No favourites found for this category',
        data: [],
      };
    }

    const formatted = favourites.map((fav) => {
      const isMovie = fav.movie !== null;
      const content = isMovie ? fav.movie : fav.series;

      let url = null;
      if (content) {
        const storagePath = isMovie
          ? appConfig().storageUrl.movie
          : appConfig().storageUrl.series;

        const thumbnailName = isMovie
          ? fav.movie!.movie_thumbnail
          : fav.series!.series_thumbnail;

        if (thumbnailName) {
          url = SojebStorage.url(`${storagePath}/${thumbnailName}`);
        }
      }

      return {
        id: fav.id, // Ekhane Favourite table-er ID dewa holo
        content_id: content?.id, // Movie/Series-er ID alada field-e dewa holo
        type: isMovie ? 'movie' : 'series',
        title: content?.title,
        thumbnail: isMovie
          ? fav.movie?.movie_thumbnail
          : fav.series?.series_thumbnail,
        url: url,
        release_date: content?.release_date,
        genres: content?.genres || [],
        category_id: content?.category_id,
      };
    });

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
