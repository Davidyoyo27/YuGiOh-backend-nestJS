import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { UuidValidationPipe } from 'src/common/pipes/uuid-validation/uuid-validation.pipe';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('administrator/all-users')
  @UseGuards( AuthGuard() )
  findAllUsers(){
    return this.adminService.findAllUsersAdmin();
  }

  @Get('administrator/:id/resend-activation')
  @UseGuards( AuthGuard() )
  //                                validacion personalizada para el UUID
  checkUserToSendEmail(@Param('id', new UuidValidationPipe()) id: string){
    return this.adminService.resendActivationEmail(id);
  }
}
