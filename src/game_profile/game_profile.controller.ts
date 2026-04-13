import { Controller, Post, Body, Patch, 
  UseGuards, UploadedFile, UseInterceptors, BadRequestException 
} from '@nestjs/common';
import { GameProfileService } from './game_profile.service';
import { CreateGameProfileDto } from './dto/create-game_profile.dto';
import { UpdateGameProfileDto } from './dto/update-game_profile.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
// NO BORRAR: aunque no se use si se quita dara error en Express.Multer.File
import { Multer } from 'multer';

// DATO: aunque en la carpeta diga game_profile (guion bajo) el que manda es el nombre que sale aca, osea game-profile (guion medio)
@Controller('game-profile')
export class GameProfileController {
  constructor(private readonly gameProfileService: GameProfileService) { }

  // crear el perfil del jugador
  @UseGuards(AuthGuard())
  @Post('profile/create-profile')
  create(
    @Body() createGameProfileDto: CreateGameProfileDto,
    // este decorador permite traer el ID del usuario
    @CurrentUserId('id') userId: string
  ) {
    return this.gameProfileService.create(createGameProfileDto, userId);
  }

  // editar campos del perfil del jugador
  @UseGuards(AuthGuard())
  // sin el /:id ya que el id del usuario viene desde el decorator internamente en el endpoint
  @Patch('profile/edit-profile')
  update(
    @CurrentUserId('id') userId: string,
    @Body() updateGameProfileDto: UpdateGameProfileDto
  ) {
    return this.gameProfileService.update(userId, updateGameProfileDto);
  }

  // endpoint que realiza la subida de la imagen del avatar/perfil del perfil de juego del usuario
  @UseGuards(AuthGuard())
  @Post('profile/create-file/upload-avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new BadRequestException('formato de imagen no valido.'), false);
        }
        cb(null, true);
      }
    })
  )
  uploadAvatarImage(
    //                            npm install -D @types/multer
    @UploadedFile() file: Express.Multer.File | any,
    @CurrentUserId('id') userId: string
  ) {
    return this.gameProfileService.uploadAvatarImage(userId, file);
  }

}
