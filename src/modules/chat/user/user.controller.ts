import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('chat/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

 
}
