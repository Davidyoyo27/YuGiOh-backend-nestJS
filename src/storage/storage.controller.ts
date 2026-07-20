import { Controller, Get, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('default-avatars')
  defaultAvatarsPerfil() {
    return this.storageService.defaultAvatarsPerfil();
  }

}
