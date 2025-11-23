
import { category_status } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';


export class UpdateStatusDto  {
  @IsEnum(category_status)
  status: category_status;
}
