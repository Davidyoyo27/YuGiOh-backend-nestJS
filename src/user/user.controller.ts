import { Controller, Get, Post, Body, Patch, Param, 
  UseInterceptors, ClassSerializerInterceptor, 
  UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyActivationDto } from './dto/verify-activation.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { UuidValidationPipe } from 'src/common/pipes/uuid-validation.pipe';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  
  constructor(private readonly userService: UserService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('account-activation')
  verify(@Body() body: VerifyActivationDto) {
    return this.userService.verifyActivation(body.emailOrNick, body.codeActivation);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(2)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(2)
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.userService.findOne(term);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(2)
  @Patch(':id')
  update(
    @Param('id', new UuidValidationPipe()) id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(2)
  @Patch('change-password/:id')
  changeUserPassword(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() changeUserPasswordDto: ChangeUserPasswordDto
  ){
    return this.userService.changePassword(id, changeUserPasswordDto);
  }
  
}
