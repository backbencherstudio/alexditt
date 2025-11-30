import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

/**
 * DTO for adding a new Season and its Episodes to an existing Series.
 */
export class CreateSeasonEpisodeDto {
  // JSON string containing season details (title, release_date)
  @IsString()
  @IsNotEmpty({
    message: 'Season information is required and must be a JSON string.',
  })
  season_info: string;

  // JSON string containing an array of episode objects
  // Each episode object should contain: episode_number, title, description, duration, release_date, key (for file mapping)
  @IsString()
  @IsNotEmpty({
    message: 'Episode information is required and must be a JSON array string.',
  })
  episodes: string;
}
