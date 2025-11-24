import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  //* Create a new category
  async create(createCategoryDto: CreateCategoryDto) {
    const { category_name, category_description } = createCategoryDto;

    if (!category_name || category_name.trim() === '') {
      throw new BadRequestException('Category name is required.');
    }

    const isExist = await this.prisma.category.findFirst({
      where: {
        category_name: category_name,
      },
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
      message: 'Category created successfully',
      data: newCategory,
    };
  }

  //* Fetch all categories
  async findAll() {
    const categories = await this.prisma.category.findMany();

    return {
      success: true,
      message: 'Categories fetched successfully',
      data: {
        categories,
      },
    };
  }

  // * Fetch a category by ID
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category fetched successfully',
      data: category,
    };
  }

  // * Update a category by ID
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { category_name, category_description } = updateCategoryDto;
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
      },
    });

    return {
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  // * Delete a category by ID
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  }

  // admin ==========================================

  //* status update
  async updateActiveStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const { status } = updateStatusDto;

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        category_status: status,
      },
    });

    return {
      message: 'Category status updated successfully',
      data: updatedCategory,
    };
  }


  //  * category with movie, series count
  async getCategoryWithContentCount() {
    const categoriesWithCount = await this.prisma.category.findMany({
      select: {
        id: true,
        category_name: true,
        category_description: true,
        category_status: true,
        _count: {
          select: {
            movies: true,
            series: true,
          },
        },
      },
    });

    // Map the results to flatten the content count for the frontend
    const categories = categoriesWithCount.map((cat) => {
      const contentCount = cat._count.movies + cat._count.series;
      
      const { _count, ...categoryData } = cat;

      return {
        ...categoryData,
        contentCount, 
      };
    });

    return {
      message: 'Categories fetched successfully',
      data: {
        categories,
      },
    };
  }







}
