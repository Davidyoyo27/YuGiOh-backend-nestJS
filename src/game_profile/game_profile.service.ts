import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { GameProfile } from '../game_profile/entities/game-profile.entity';

import { CreateGameProfileDto } from './dto/create-game_profile.dto';
import { UpdateGameProfileDto } from './dto/update-game_profile.dto';

import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class GameProfileService {

  constructor(
    @InjectRepository(GameProfile)
    private readonly userGameProfileRepository: Repository<GameProfile>,

    private readonly storageService: StorageService,
  ) { }

  async create(createGameProfileDto: CreateGameProfileDto, userId: string) {
    // verificamos primeramente si existe un perfil ya creado, 
    // recordar que solo puede existir un perfil por usuario
    const existProfile = await this.userGameProfileRepository.findOne({
      where: { user: { id: userId } }
    });

    if (existProfile) throw new BadRequestException('Ya existe un perfil creado para este usuario.');

    const { nickName } = createGameProfileDto;

    const profile = this.userGameProfileRepository.create({
      nickName: nickName === '' ? null : nickName,
      // error del 'DeepPartial<User>', RECORDAR que las relaciones son objetos NO columnas simples
      user: { id: userId }
    });

    return await this.userGameProfileRepository.save(profile);
  }

  // actualizacion del perfil del jugador
  async update(userId: string, updateGameProfileDto: UpdateGameProfileDto) {

    const { nickName } = updateGameProfileDto;

    const userGameProfile = await this.userGameProfileRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!userGameProfile) throw new NotFoundException('El perfil del jugador no fue encontrado.');

    // campos que se desean actualizar
    userGameProfile.nickName = nickName;

    await this.userGameProfileRepository.save(userGameProfile);

    return { ok: true, message: 'Apodo modificado con exito.' }
  }

  // sube la imagen de perfil del avatar
  async uploadAvatarImage(userId: string, file: Express.Multer.File) {

    if (!file) throw new NotFoundException('Debe seleccionar o subir una imagen.');

    const gameProfile = await this.userGameProfileRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!gameProfile) throw new NotFoundException('El perfil del jugador no fue encontrado.');

    const pathUploadedImage = await this.storageService.uploadAvatar(file, userId);

    await this.userGameProfileRepository.update(
      { user: { id: userId } },
      { avatarUrl: pathUploadedImage }
    );

    return {
      ok: true,
      message: 'Imagen del Avatar guardada correctamente.',
      user: {
        id: gameProfile.user.id,
        userName: gameProfile.user.name,
        email: gameProfile.user.email,
        role: gameProfile.user.typeUser.id,
        profileId: gameProfile?.id ?? null,
        nickName: gameProfile?.nickName ?? null,
        createdAt: gameProfile?.createdAt ?? null,
        avatarUrl: gameProfile?.avatarUrl ?? null,
      }
    };
  }

}
