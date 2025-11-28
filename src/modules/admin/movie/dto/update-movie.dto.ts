import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';
import { IsArray, IsOptional } from 'class-validator';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @IsOptional()
  @IsArray()
  cast_delete_ids?: string[];
}
