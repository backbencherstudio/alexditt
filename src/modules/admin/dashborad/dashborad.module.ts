import { Module } from '@nestjs/common';
import { DashboradService } from './dashborad.service';
import { DashboradController } from './dashborad.controller';
import { Prisma } from '@prisma/client';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule
  ],
  controllers: [DashboradController],
  providers: [DashboradService],
})
export class DashboradModule {}
