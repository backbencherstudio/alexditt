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

    const isExist = await this.prisma.categoryModel.findFirst({
      where: {
        category_name: category_name,
      },
    });

    if (isExist) {
      throw new BadRequestException('Category name already exists.');
    }

    const newCategory = await this.prisma.categoryModel.create({
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
    const categories = await this.prisma.categoryModel.findMany();

    return {
      message: 'Categories fetched successfully',
      data: {
        categories,
      },
    };
  }

  // * Fetch a category by ID
  async findOne(id: string) {
    const category = await this.prisma.categoryModel.findUnique({
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
    const category = await this.prisma.categoryModel.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const updatedCategory = await this.prisma.categoryModel.update({
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

  // admin update active status of category
  async updateActiveStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const { status } = updateStatusDto;

    const category = await this.prisma.categoryModel.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.prisma.categoryModel.update({
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

  // * Delete a category by ID
  async remove(id: string) {
    const category = await this.prisma.categoryModel.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.prisma.categoryModel.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  }

  
}
