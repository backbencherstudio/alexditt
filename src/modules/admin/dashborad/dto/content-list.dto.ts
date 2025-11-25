
import { PaginationDto } from 'src/common/pagination/dto/offset-pagination.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator'; 
import { Genre, Status } from '@prisma/client'; 

export class ContentListDto extends PaginationDto {
  
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre; 

  @IsOptional()
  @IsString()
  category?: string;
  
  @IsOptional()
  status?: string;
}