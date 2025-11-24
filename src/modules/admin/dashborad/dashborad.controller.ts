import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DashboradService } from './dashborad.service';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('dashborad')
export class DashboradController {

  constructor(private readonly dashboradService: DashboradService) {}

  //a-dmin dashborad total user,videos,deatils
  @Get()
  async getDashboardData() {
    return this.dashboradService.getDashboardData();
  }



}
