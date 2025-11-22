import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { EmailResetPasswordDto } from './dto/email-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  // ingresas tu correo para solicitar el cambio de contraseña
  @Post('forgot-your-password')
  forgotPassword(@Body() body: EmailResetPasswordDto){
    return this.authService.sendEmailForgotPassword(body.email);
  }

  // endpoint de validacion del token generado en 'forgot-your-password'
  @Get('reset-password/:token')
  validateResetToken(@Param('token') token: string){
    return this.authService.validateTokenReset(token);
  }

  // endpoint donde se escribe la nueva contraseña
  @Patch('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto){
    return this.authService.resetPassword(resetPasswordDto);
  }

}