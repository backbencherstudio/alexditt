import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateFavouriteDto {
  
  @ValidateIf(o => !o.series_id)
  @IsString()
  movie_id?: string;

  @ValidateIf(o => !o.movie_id)
  @IsString()
  series_id?: string;
}
