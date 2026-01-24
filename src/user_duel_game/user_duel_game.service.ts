import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { GameProfile } from 'src/game_profile/entities/game-profile.entity';
import { UserDuelGame } from './entities/user_duel_game.entity';
import { DuelState } from 'src/duel_game/entities/duel-state.entity';
import { DuelGame } from 'src/duel_game/entities/duel-game.entity';

// permite usar transaction
import { DataSource } from 'typeorm';
import { error } from 'console';

@Injectable()
export class UserDuelGameService {

  constructor(

    @InjectRepository(GameProfile)
    private readonly userGameProfileRepository: Repository<GameProfile>,

    private readonly dataSource: DataSource,
  ) { }

  // funcion que permite unirse a los jugadores
  // esta operacion ocupa transaction + lock
  async joinDuel(id: number, userId: string) {

    await this.dataSource.transaction(async (manager) => {

      // 🔒 lock pesimista
      // primero verificar que realmente exista la sala del duelo
      const duelGame = await manager.createQueryBuilder(DuelGame, 'duel')
        .where('duel.id = :id', { id })
        .setLock('pessimistic_write')  // FOR UPDATE
        .getOne();

      if (!duelGame) throw new NotFoundException('La sala del duelo al cual esta accediendo no existe.');

      // ❌ sala llena
      if (duelGame.playersJoined >= duelGame.playersNumber)
        throw new BadRequestException('La sala ya se encuentra llena, no se permiten más jugadores.');

      const userGameProfile = await this.userGameProfileRepository.findOne({
        where: { user: { id: userId } }
      });

      if (!userGameProfile) throw new NotFoundException('Debes tener tu perfil de jugador para poder unirte a un duelo.');

      // ❌ evitar doble ingreso al mismo jugador
      const alreadyJoined = await manager.findOne(UserDuelGame, {
        where: {
          duelGame: { id: duelGame.id },
          gameProfile: { id: userGameProfile.id }
        }
      });

      if (alreadyJoined) throw new BadRequestException('Ya estas unido a este duelo.');

      // ✅ unir jugador
      await manager.save(UserDuelGame, {
        duelGame: { id: duelGame.id },
        gameProfile: { id: userGameProfile.id },
      });

      // actualizar contador
      // await manager.update(DuelGame, 
      //   { id: duelGame.id }, 
      //   { playersJoined: duelGame.playersJoined + 1 }
      // );

      // ✅ actualizar contador
      duelGame.playersJoined += 1;

      // Verificamos si la sala ya se llenó, de ser asi cambiamos el estado de la sala del duelo a "en_proceso"
      if (duelGame.playersJoined === duelGame.playersNumber) {
        const inProcessState = await manager.findOne(DuelState, {
          // where: { stateName: 'en_proceso' },
          where: { id: 2 },
        });

        if (!inProcessState) throw new error('Estado 2 no existe en la base de datos.');

        duelGame.typeState = inProcessState;
      }

      // se guardan todos los cambios realizados incluidos actualizaciones de campos
      await manager.save(duelGame);
    });

    return { ok: true, message: 'Te has unido exitosamente a la sala del duelo.' };
  }

}
