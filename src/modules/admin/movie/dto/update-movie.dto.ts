import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';
import { IsArray, IsJSON, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => item.trim());
    }
    if (typeof value === 'string') return [value];
    return value;
  })
  cast_delete_ids?: string[];

  @IsJSON()
  @IsOptional()
  cast_update?: string;
  
}
