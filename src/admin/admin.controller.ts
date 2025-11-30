import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { UuidValidationPipe } from 'src/common/pipes/uuid-validation.pipe';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  // NOTA: El orden del los @ es importante
  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(3)
  @Get('administrator/all-users')
  findAllUsers(){
    return this.adminService.findAllUsersAdmin();
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(3)
  @Get('administrator/:id/resend-activation')
  //                                validacion personalizada para el UUID
  checkUserToSendEmail(@Param('id', new UuidValidationPipe()) id: string){
    return this.adminService.resendActivationEmail(id);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(3)
  @Patch('administrator/block-user-account/:id')
  blockUser(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() updateUserByAdminDto: UpdateUserByAdminDto
  ){
    return this.adminService.blockUserAdmin(id, updateUserByAdminDto);
  }

}
