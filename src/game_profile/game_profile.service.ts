import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { GameProfile } from '../game_profile/entities/game-profile.entity';
import { User } from 'src/user/entities/user.entity';

import { CreateGameProfileDto } from './dto/create-game_profile.dto';
import { UpdateGameProfileDto } from './dto/update-game_profile.dto';

import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class GameProfileService {

  constructor(
    @InjectRepository(GameProfile)
    private readonly userGameProfileRepository: Repository<GameProfile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly storageService: StorageService,
  ) { }

  async createGameProfile(createGameProfileDto: CreateGameProfileDto, userId: string) {
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

    await this.userGameProfileRepository.save(profile);

    const userDB = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['gameProfile'],
    });

    return {
      ok: true,
      message: 'Perfil de jugador creado correctamente.',
      // DATO: retornamos los nuevos datos de gameProfile para que el Front pueda mostrar la data actualizada
      // en el checkAuth sin necesidad de recargar la pagina para visualizarlos
      user: {
        id: userDB?.id,
        userName: userDB?.name,
        lastName: userDB?.lastName,
        email: userDB?.email,
        role: userDB?.typeUser.id,
        profileId: userDB?.gameProfile.id ?? null,
        nickName: userDB?.gameProfile.nickName ?? null,
        createdAt: userDB?.gameProfile.createdAt ?? null,
        avatarUrl: userDB?.gameProfile.avatarUrl ?? null,
      }
    }
  }

  // actualizacion del perfil del jugador
  async updateGameProfile(userId: string, updateGameProfileDto: UpdateGameProfileDto) {

    const { nickName } = updateGameProfileDto;

    const userGameProfile = await this.userGameProfileRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!userGameProfile) throw new NotFoundException('El perfil del jugador no fue encontrado.');

    // campos que se desean actualizar
    userGameProfile.nickName = nickName?.trim();

    await this.userGameProfileRepository.save(userGameProfile);    

    return {
      ok: true,
      message: 'Apodo modificado con exito.',
      user: {
        id: userGameProfile.user.id,
        userName: userGameProfile.user.name,
        lastName: userGameProfile.user.lastName,
        email: userGameProfile.user.email,
        role: userGameProfile.user.typeUser.id,
        profileId: userGameProfile.id,
        nickName: userGameProfile.nickName,
        createdAt: userGameProfile.createdAt,
        avatarUrl: userGameProfile.avatarUrl,
      }
    }
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
