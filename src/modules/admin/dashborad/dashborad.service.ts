import { Injectable } from '@nestjs/common';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';
import { Genre, Movie, Series } from '@prisma/client';
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

    const where: any = {};
    if (genres && genres.length > 0) {
      where.genres = { hasSome: genres };
    }
    if (category_id) {
      where.category_id = category_id;
    }
    if (status) {
      where.status = status;
    }

   
    const [movieMetadata, seriesMetadata, totalMovieItems, totalSeriesItems] =
      await Promise.all([
        this.prisma.movie.findMany({
          where,
          select: { id: true, created_at: true },
        }),
        this.prisma.series.findMany({
          where,
          select: { id: true, created_at: true },
        }),
        this.prisma.movie.count({ where }),
        this.prisma.series.count({ where }),
      ]);

    const totalItems = totalMovieItems + totalSeriesItems;

    const mergedMetadata = [
      ...movieMetadata.map((m) => ({ ...m, type: 'Movie' as const })),
      ...seriesMetadata.map((s) => ({ ...s, type: 'Series' as const })),
    ];

    mergedMetadata.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime(),
    );

    const skip = (page - 1) * perPage;
    const paginatedMetadata = mergedMetadata.slice(skip, skip + perPage);

    const movieIds = paginatedMetadata
      .filter((item) => item.type === 'Movie')
      .map((item) => item.id);
    const seriesIds = paginatedMetadata
      .filter((item) => item.type === 'Series')
      .map((item) => item.id);

    const [paginatedMovies, paginatedSeries] = await Promise.all([
      this.prisma.movie.findMany({
        where: { id: { in: movieIds } },
        include: { category: { select: { category_name: true } } }, 
      }),
      this.prisma.series.findMany({
        where: { id: { in: seriesIds } },
        include: { category: { select: { category_name: true } } }, 
      }),
    ]);

   
    const finalPaginatedContent = paginatedMetadata.map((metadata) => {
      if (metadata.type === 'Movie') {
        return paginatedMovies.find((m) => m.id === metadata.id);
      }
      return paginatedSeries.find((s) => s.id === metadata.id);
    });

    
    const formattedContent = finalPaginatedContent
      .filter(Boolean)
      .map((content: any) => ({
        id: content.id,
        thumbnail: content.movie_thumbnail
          ? SojebStorage.url(
              `${appConfig().storageUrl.movie}/${content.movie_thumbnail}`,
            )
          : content.series_thumbnail
            ? SojebStorage.url(
                `${appConfig().storageUrl.series}/${content.series_thumbnail}`,
              )
            : null,
        title: content.title,
        genre: content.genres.join(', '),
        category: content.category?.category_name || null,
        duration: content.duration || 'N/A (Series)',
        type: content.movie_thumbnail ? 'Movie' : 'Series',
        status: content.status,
        uploaded: content.created_at,
      }));

    return {
      success: true,
      message:
        'Content list (Movies and Series) fetched successfully (Optimized)',
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
