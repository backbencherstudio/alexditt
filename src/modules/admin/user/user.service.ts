import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import appConfig from '../../../config/app.config';
import { StatusType } from '@prisma/client';
import { UpdateProfileDto } from './dto/updateprofile.dto';
import * as bcrypt from 'bcrypt';
import { StringHelper } from 'src/common/helper/string.helper';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // * get all data user deatils (Paginated and Optional Status Filter)
  async findAll(paginationDto: PaginationDto, status: string) {
   
    let whereClause: any = {};
    const formattedStatus =
      typeof status === 'string' && status.length > 0
        ? status.toUpperCase()
        : null;

    if (formattedStatus && StatusType[formattedStatus]) {
      whereClause = { status: StatusType[formattedStatus] };
    }

    const { page, perPage } = paginationDto;
    const skip = (page - 1) * perPage;

    const [totalItems, users] = await Promise.all([
      
      this.prisma.user.count({ where: whereClause }),

      this.prisma.user.findMany({
        where: whereClause, 
        select: {
          id: true,
          created_at: true,
          name: true,
          email: true,
          status: true,
        },
        skip: skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      success: true,
      message: `Users with details retrieved successfully`,
      data: users,
      pagination: {
        page,
        perPage,
        totalItems,
        totalPages,
      },
    };
  }

  //* get all data user deatils (Paginated and Filtered by Status)
  async findAllStatus(status: string, paginationDto: PaginationDto) {
    const formattedStatus = status.toUpperCase();
    const statusType = StatusType[formattedStatus];

    // Check if the provided status is valid (optional, but good practice)
    if (!statusType) {
      return {
        success: false,
        message: `Invalid status provided: ${status}`,
        data: [],
      };
    }

    const { page, perPage } = paginationDto;
    const skip = (page - 1) * perPage;

    const whereClause = { status: statusType }; // Define the filter

    // Fetch total count and paginated data concurrently
    const [totalItems, users] = await Promise.all([
      this.prisma.user.count({ where: whereClause }), // Count filtered items
      this.prisma.user.findMany({
        where: whereClause, // Apply the filter
        select: {
          id: true,
          created_at: true,
          name: true,
          email: true,
          status: true,
        },
        skip: skip, // APPLY PAGINATION
        take: perPage, // APPLY PAGINATION
        orderBy: { created_at: 'desc' }, // Added sorting
      }),
    ]);

    const totalPages = Math.ceil(totalItems / perPage);

    return {
      success: true,
      message: `Users with status: ${formattedStatus} retrieved successfully`,
      data: users,
      pagination: {
        page,
        perPage,
        totalItems,
        totalPages: totalPages,
      },
    };
  }

  // * user deatails
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        gender: true,
        description: true,
        avatar: true,
        status: true,
        created_at: true,
      },
    });

    // const storageUrl = appConfig().storageUrl.avater;
    if (user && user.avatar) {
      user.avatar = SojebStorage.url(
        `${appConfig().storageUrl.profile}/${user.avatar}`,
      );
    }

    return {
      success: true,
      message: 'User details retrieved successfully',
      data: user,
    };
  }

  // * update profile details
  async updateprofile(
    id: string,
    updateUserDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ) {
    const data: any = {};

    if (updateUserDto.name) {
      data.name = updateUserDto.name;
    }
    if (updateUserDto.email) {
      data.email = updateUserDto.email;
    }
    if (updateUserDto.phone_number) {
      data.phone_number = updateUserDto.phone_number;
    }
    if (updateUserDto.gender) {
      data.gender = updateUserDto.gender;
    }
    if (updateUserDto.description) {
      data.description = updateUserDto.description;
    }
    if (updateUserDto.password) {
      const password = await bcrypt.hash(
        updateUserDto.password,
        appConfig().security.salt,
      );
      data.password = password;
    }

    if (updateUserDto.status) {
      const formattedStatus = updateUserDto.status.toUpperCase();
      data.status = StatusType[formattedStatus];
    }

    if (avatarFile) {
      const oldImage = await this.prisma.user.findUnique({
        where: { id },
        select: { avatar: true },
      });

      if (oldImage.avatar) {
        await SojebStorage.delete(
          `${appConfig().storageUrl.profile}/${oldImage.avatar}`,
        );
      }

      const fileName = `${StringHelper.randomString(8)}_${avatarFile.originalname}`;
      await SojebStorage.put(
        `${appConfig().storageUrl.profile}/${fileName}`,
        avatarFile.buffer,
      );
      data.avatar = fileName;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: data,
    });

    return {
      success: true,
      message: 'User profile updated successfully',
      data: user,
    };
  }

  // * delete user
  async delete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { avatar: true },
    }); 
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    if (user.avatar) {
      await SojebStorage.delete(
        `${appConfig().storageUrl.profile}/${user.avatar}`,
      );
    }
    await this.prisma.user.delete({
      where: { id },
    });
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }


  
}
