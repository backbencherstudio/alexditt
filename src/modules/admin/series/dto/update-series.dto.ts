import { PartialType } from '@nestjs/swagger';
import { CreateSeriesDto } from './create-series.dto';
import { IsString } from 'class-validator';

export class UpdateSeriesDto extends PartialType(CreateSeriesDto) {


    @IsString()
    cast_delete_ids?: string[];
    
    @IsString()
    episode_delete_ids?: string[];

}
