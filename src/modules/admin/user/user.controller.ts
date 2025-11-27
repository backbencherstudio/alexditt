import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/updateprofile.dto';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';

@ApiBearerAuth()
@ApiTags('User')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // * get all data user deatils
  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.userService.findAll(paginationDto, status);
  }

  //* get all data user deatils
  @Get('/:status')
  async findAllStatus(
    @Param('status') status: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.userService.findAllStatus(status, paginationDto);
  }

  // * user deatails
  @Get('user-view/:id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // * update profile details
  @UseInterceptors(
    FileInterceptor('avater', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.userService.updateprofile(id, updateUserDto, avatar);
  }
  
  // * delete user
  @Delete(':id') 
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }



}
