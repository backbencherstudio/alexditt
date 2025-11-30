import { PartialType } from '@nestjs/swagger';
import { CreateSeriesDto } from './create-series.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSeriesDto extends PartialType(CreateSeriesDto) {
  @IsString()
  @IsOptional()
  cast_delete_ids?: string[];

  @IsString()
  @IsOptional()
  episode_delete_ids?: string[];
}
