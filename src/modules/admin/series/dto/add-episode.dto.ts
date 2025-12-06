import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for adding Episodes to an existing Series/Season.
 */
export class AddEpisodesDto {
  
  // JSON string containing an array of episode objects
  @IsString()
  @IsNotEmpty({ message: 'Episode information is required and must be a JSON array string.' })
  episodes: string;
}