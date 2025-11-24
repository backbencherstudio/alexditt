import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import { StatusType } from '@prisma/client';

@Injectable()
export class UserService {
  
  constructor(private prisma: PrismaService) {}

  //* get all data user deatils
  async findAll(
    status: string,
  ) {

    const formattedStatus = status.toUpperCase()
  
    const users = await this.prisma.user.findMany({
      where: {
        status: StatusType[formattedStatus],
      },
     select: {
       id: true,
       created_at: true,
       name: true,
       email: true, 
       status: true,
     },
    });

    if (!users || users.length === 0) {
      return {
        success: true,
        message: `No users found with status: ${formattedStatus}`,
        data: [],
      };
    }

    return {
      success: true,
      message: `Users with status: ${formattedStatus} retrieved successfully`,
      data: users,
    }
    
    
  }





}
