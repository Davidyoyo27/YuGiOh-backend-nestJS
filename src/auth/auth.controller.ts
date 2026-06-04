import { Controller, Post, Body, Get, Param, Patch, Req, UseGuards, Res } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { EmailResetPasswordDto } from './dto/email-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { getClientData } from 'src/common/utils/functions';
import { AuthGuard } from '@nestjs/passport';
import { CurrentSessionId } from './decorators/current-session-id.decorator';
import type { Request, Response } from 'express';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @Post('login')
  loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: any
  ) {
    const reqData = getClientData(req);

    return this.authService.login(loginUserDto, reqData, res);
  }

  @UseGuards(AuthGuard())
  @Post('logout')
  logoutUser(
    @CurrentSessionId() sessionId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(sessionId, res);
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req, res);
  }

  // sirve para:
  // -verificar si existe una sesión válida.
  // -recuperar la sesión después de F5.
  // -recuperar la sesión después de cerrar y abrir la pestaña.
  // -inicializar el AuthStore.
  // -decidir si mostrar Login o Home.
  // -alimentar los Guards.
  @Get('check-auth')
  @UseGuards(AuthGuard(), RolesGuard)
  checkAuth(
    @CurrentUserId('id') userId: string,
  ) {
    return this.authService.checkAuth(userId);
  }

}