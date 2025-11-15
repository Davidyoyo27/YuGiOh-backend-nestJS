import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { VerifyActivationDto } from './dto/verify-activation.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService
  ) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('verify-email')
  verify(@Body() body: VerifyActivationDto){
    return this.userService.verifyActivation(body.emailOrNick, body.codeActivation);
  }
}