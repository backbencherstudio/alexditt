import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';
import { IsArray, IsJSON, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'string') return parsed;
      } catch (e) {
      }
      return value.trim();
    }
    return value;
  })
  cast_delete_id?: string;

  @IsJSON()
  @IsOptional()
  cast_update?: string;

}
