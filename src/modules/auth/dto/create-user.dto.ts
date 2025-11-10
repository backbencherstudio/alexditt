import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email should not be empty.' })
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsOptional()
  @MinLength(8, { message: 'Password should be minimum 8' })
  @ApiProperty()
  password?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'user',
  })
  type?: string;
}
