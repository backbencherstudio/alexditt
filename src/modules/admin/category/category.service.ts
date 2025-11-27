import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================
  async create(createCategoryDto: CreateCategoryDto) {
    const { category_name, category_description } = createCategoryDto;

    if (!category_name?.trim()) {
      throw new BadRequestException('Category name is required.');
    }

    const isExist = await this.prisma.category.findFirst({
      where: { category_name },
    });

    if (isExist) {
      throw new BadRequestException('Category name already exists.');
    }

    const newCategory = await this.prisma.category.create({
      data: {
        category_name,
        category_description,
      },
    });

    return {
      success: true,
      message: 'Category created successfully',
      data: newCategory,
    };
  }

  // =========================================================
  // GET ALL
  // =========================================================
  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { created_at: 'asc' }
    });

    return {
      success: true,
      message: 'Categories fetched successfully',
      data: categories, // direct array
    };
  }

  // =========================================================
  // GET ONE
  // =========================================================
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      success: true,
      message: 'Category fetched successfully',
      data: category,
    };
  }

  // =========================================================
  // UPDATE
  // =========================================================
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { category_name, category_description, status } = updateCategoryDto;

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        category_name,
        category_description,
        category_status: status,
      },
    });

    return {
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  // =========================================================
  // DELETE
  // =========================================================
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });

    return {
      success: true,
      message: 'Category deleted successfully',
      data: null, // keep structure consistent
    };
  }

  // =========================================================
  // ADMIN - CATEGORY WITH COUNT
  // =========================================================
  async getCategoryWithContentCount() {
    const categoriesWithCount = await this.prisma.category.findMany({
      select: {
        id: true,
        category_name: true,
        category_description: true,
        category_status: true,
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    const categories = categoriesWithCount.map((cat) => {
      const { _count, ...rest } = cat;
      return {
        ...rest,
        movieCount: _count.movies ?? 0,
        seriesCount: _count.series ?? 0,
        contentCount: (_count.movies ?? 0) + (_count.series ?? 0),
      };
    });

    return {
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
    };
  }

  // =========================================================
  // ADMIN - CATEGORY WITH COUNT BY STATUS
  // =========================================================
  async getCategoryWithContentCountByStatus(status: string) {
    const filterStatus = status.toUpperCase();

    if (!['ACTIVE', 'INACTIVE'].includes(filterStatus)) {
      throw new BadRequestException('Status must be ACTIVE or INACTIVE');
    }

    const categoriesWithCount = await this.prisma.category.findMany({
      where: { category_status: filterStatus as any },
      select: {
        id: true,
        category_name: true,
        category_description: true,
        category_status: true,
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    const categories = categoriesWithCount.map((cat) => {
      const { _count, ...rest } = cat;
      return {
        ...rest,
        movieCount: _count.movies ?? 0,
        seriesCount: _count.series ?? 0,
        contentCount: (_count.movies ?? 0) + (_count.series ?? 0),
      };
    });

    return {
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
    };
  }
}
