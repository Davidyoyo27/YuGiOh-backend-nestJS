import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UuidValidationPipe } from 'src/common/pipes/uuid-validation.pipe';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateUserByAdminDto } from 'src/admin/dto/update-user-by-admin.dto';
import { OnlyNumbersPipe } from 'src/common/pipes/id-number-validation.pipe';

@Controller('superadmin')
export class SuperadminController {
  constructor(
    private readonly superadminService: SuperadminService,
  ) {}

  @Post('superadministrator/create-superadmin')
  createSuperAdmin(@Body() createUserDto: CreateUserDto) {
    return this.superadminService.createSuperAdmin(createUserDto);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(4)
  @Post('superadministrator/create-admin')
  createAdmin(@Body() createUserDto: CreateUserDto){
    return this.superadminService.createAdmin(createUserDto);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(4)
  @Get('superadministrator/all-users')
  findAll(@Query('types') types?: string) {
    let typesArray: number[] | undefined;
    // convertir "2,3" a [2, 3]
    if(types) typesArray = types.split(',').map(num => Number(num));
    return this.superadminService.findAll(typesArray);
  }

  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(4)
  @Patch('superadministrator/update-superadmin-perfil/:id')
  update(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto
  ){
    return this.superadminService.update(id, updateUserDto);
  }

  // bloquear usuarios de tipo Administrador y/o Duelista
  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(4)
  @Patch('superadministrator/block-user-account/:id')
  blockUserAccount(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() updateUserByAdminDto: UpdateUserByAdminDto
  ){
    return this.superadminService.blockUserAccount(id, updateUserByAdminDto);
  }

  // cerrar todas las sesiones de un usuario
  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(4)
  @Patch('superadministrator/finish-user-all-sessions/:id')
  userFinishAllActiveSession(
    @Param('id', new UuidValidationPipe()) id: string,
  ){
    return this.superadminService.userFinishAllActiveSession(id);
  }

  // cerrar SOLO una sesion especifica de un usuario
  @UseGuards( AuthGuard(), RolesGuard )
  @Roles(4)
  @Patch('superadministrator/finish-user-session/:id')
  userFinishActiveSession(
    @Param('id', OnlyNumbersPipe) id: number,
  ){
    return this.superadminService.userFinishActiveSession(id);
  }

}
