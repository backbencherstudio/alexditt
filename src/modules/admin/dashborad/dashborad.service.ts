import { Injectable } from '@nestjs/common';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';
import { Genre } from '@prisma/client';
import { ContentListDto } from './dto/content-list.dto';
import appConfig from 'src/config/app.config';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';

@Injectable()
export class DashboradService {
  constructor(private prisma: PrismaService) {}

  // note(genre,category)

  // *genre list
  async getGenreList() {
    const genreList = Object.values(Genre);

    return {
      success: true,
      message: 'Genre list retrieved successfully from Prisma client',
      data: genreList,
    };
  }

  // *category list
  async getCategoryList() {
    const categories = await this.prisma.category.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        category_name: true,
      },
    });

    return {
      success: true,
      message: 'Category list retrieved successfully from Prisma client',
      data: categories,
    };
  }

  /*--------------------------------------------------------------------------*/

  // *admin dashborad total user, videos, details
  async getDashboardData(paginationDto: PaginationDto) {
    const { page, perPage } = paginationDto;

    const skip = (page - 1) * perPage;

    const whereClause = { deleted_at: null };

    const [totalUsers, totalMovies, totalSeries, recentUsers] =
      await Promise.all([
        this.prisma.user.count({ where: whereClause }),

        this.prisma.movie.count(),

        this.prisma.series.count(),

        this.prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            created_at: true,
            status: true,
          },
          orderBy: {
            created_at: 'desc',
          },
          skip: skip,
          take: perPage,
        }),
      ]);

    const totalVideos = totalMovies + totalSeries;

    const formattedRecentUsers = recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      status: user.status,
    }));

    return {
      success: true,
      message: 'Dashboard data fetched successfully',
      data: {
        total_users: totalUsers,
        total_videos: totalVideos,
        user_details: formattedRecentUsers,
        pagination: {
          page: page,
          perPage: perPage,
          totalItems: totalUsers,
          totalPages: Math.ceil(totalUsers / perPage),
        },
      },
    };
  }

  // *list for the media content table (based on image)
  async getContentList(contentListDto: ContentListDto) {
    const { page, perPage, genres, category_id, status } = contentListDto;

    const skip = (page - 1) * perPage;

    const where: any = {};

    // optional genre filter
    if (genres && genres.length > 0) {
      where.genres = { hasSome: genres };
    }

    // optional category filter
    if (category_id) {
      where.category_id = category_id;
    }

    // optional status filter
    if (status) {
      where.status = status;
    }

    const [totalItems, contentList] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        skip,
        take: perPage,
        select: {
          movie_thumbnail: true,
          title: true,
          genres: true,
          category: { select: { category_name: true } },
          duration: true,
          status: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const formattedContent = contentList.map((movie) => ({
      thumbnail: movie.movie_thumbnail
        ? SojebStorage.url(
            `${appConfig().storageUrl.movie}/${movie.movie_thumbnail}`,
          )
        : null,
      title: movie.title,
      genre: movie.genres.join(', '),
      category: movie.category?.category_name || null,
      duration: movie.duration,
      status: movie.status,
      uploaded: movie.created_at,
    }));

    return {
      success: true,
      message: 'Content list fetched successfully',
      data: formattedContent,
      pagination: {
        page,
        perPage,
        totalItems,
        totalPages: Math.ceil(totalItems / perPage),
      },
    };
  }
}
