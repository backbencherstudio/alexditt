import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';
import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { Genre, Status } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class ContentListDto extends PaginationDto {
  
  @IsOptional()
  @IsArray()
  @IsEnum(Genre, { each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  genres?: Genre[];

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
