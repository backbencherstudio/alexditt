// create-category.dto.ts
import { category_status } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';


export class CreateCategoryDto {
  @IsString()
  category_name: string;

  @IsOptional()
  @IsString()
  category_description?: string;

}
