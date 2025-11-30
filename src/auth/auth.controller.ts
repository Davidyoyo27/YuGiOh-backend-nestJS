import { Controller, Post, Body, Get, Param, Patch, Req } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { EmailResetPasswordDto } from './dto/email-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UuidValidationPipe } from 'src/common/pipes/uuid-validation.pipe';
import { getClientData } from 'src/common/utils/functions';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @Post('login')
  loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: any
  ) {
    const reqData = getClientData(req);
    console.log(reqData);

    return this.authService.login(loginUserDto, reqData);
  }

  // ingresas tu correo para solicitar el cambio de contraseña
  @Post('forgot-your-password')
  forgotPassword(@Body() body: EmailResetPasswordDto) {
    return this.authService.sendEmailForgotPassword(body.email);
  }

  // endpoint de validacion del token generado en 'forgot-your-password'
  @Get('reset-password/:token')
  validateResetToken(@Param('token') token: string) {
    return this.authService.validateTokenReset(token);
  }

  // endpoint donde se escribe la nueva contraseña
  @Patch('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('refresh')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Body('userId', new UuidValidationPipe()) userId: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

}