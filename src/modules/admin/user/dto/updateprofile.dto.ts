import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  IsIn,
  Matches,
} from 'class-validator';


export class UpdateProfileDto {
  

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  status?: string;
  


}
