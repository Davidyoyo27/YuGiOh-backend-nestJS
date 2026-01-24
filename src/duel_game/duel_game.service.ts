import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { DuelGame } from './entities/duel-game.entity';
import { GameProfile } from 'src/game_profile/entities/game-profile.entity';

import { CreateDuelGameDto } from './dto/create-duel_game.dto';

import { isNumberPairPositive } from 'src/common/utils/functions';

@Injectable()
export class DuelGameService {

  constructor(
    @InjectRepository(DuelGame)
    private readonly duelGameRepository: Repository<DuelGame>,

    @InjectRepository(GameProfile)
    private readonly userGameProfileRepository: Repository<GameProfile>,
  ) { }

  async createDuelGame(createDuelGameDto: CreateDuelGameDto, userId: string) {

    const { playersNumber, typeDuel, roomName } = createDuelGameDto;

    const userGameProfile = await this.userGameProfileRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!userGameProfile) throw new NotFoundException('Debes tener tu perfil de jugador para poder crear duelos.');

    if (playersNumber < 2)
      throw new BadRequestException('El valor minimo de jugadores debe ser 2 para poder crear el duelo.');

    if (!isNumberPairPositive(playersNumber))
      throw new BadRequestException('La cantidad de jugadores debe ser un numero par.');

    const duel = await this.duelGameRepository.create({
      playersNumber,
      duelDateCreated: new Date(),
      typeDuel: { id: typeDuel },
      typeState: { id: 1 },  // 1 = esperando
      createdBy: { id: userGameProfile.id },
      roomName
    });

    await this.duelGameRepository.save(duel);
    
    return { ok: true, message: 'Duelo creado correctamente.', duel, userGameProfile };
  }

  // retorna todos los duelos con estado "esperando"
  async findAllAvailableDuels() {

    const duels = await this.duelGameRepository.find({
      where: { typeState: { id: 1 } }
    })

    const duelsFiltered = duels.map(items => {
      return {
        id: items.id,
        type: items.typeDuel.description.split(' ')[0],
        playersJoined: items.playersJoined,
        maxPlayers: items.playersNumber,
        status: items.typeState.stateName
      }
    });

    return duelsFiltered;
  }

}
