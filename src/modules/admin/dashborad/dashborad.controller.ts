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
} from '@nestjs/common';
import { DashboradService } from './dashborad.service';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';
import { ContentListDto } from './dto/content-list.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('dashborad')
export class DashboradController {
  constructor(private readonly dashboradService: DashboradService) {}

  // note(genre,category)

  // *genrelist
  @Get('genre-list')
  async getGenreList() {
    return this.dashboradService.getGenreList();
  }

  // *category list
  @Get('category-list')
  async getCategoryList() {
    return this.dashboradService.getCategoryList();
  }

  /*--------------------------------------------------------------------------*/

  // *admin dashborad total user,videos,deatils
  @Get('deatils')
  async getDashboardData(@Query() paginationDto: PaginationDto) {
    return this.dashboradService.getDashboardData(paginationDto);
  }

  // *list for the media content table (based on image)
  @Get('content-list')
  async getContentList(@Query() contentListDto: ContentListDto) {
    return this.dashboradService.getContentList(contentListDto);
  }
}
