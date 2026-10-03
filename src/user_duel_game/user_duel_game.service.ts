import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserDuelGame } from '../user_duel_game/entities/user_duel_game.entity';
import { DuelState } from '../duel_game/entities/duel-state.entity';
import { DuelGame } from '../duel_game/entities/duel-game.entity';

import { FinishDuelDto } from './dto/finish-duel.dto';

// permite usar transaction
import { DataSource } from 'typeorm';
import { error } from 'console';
import { DuelResult } from 'src/common/utils/duel-result';
import { CancelDuelDto } from 'src/duel_game/dto/cancel-duel.dto';
import { GameProfile } from 'src/game_profile/entities/game-profile.entity';

@Injectable()
export class UserDuelGameService {

  constructor(

    @InjectRepository(DuelGame)
    private readonly duelGameRepository: Repository<DuelGame>,

    @InjectRepository(UserDuelGame)
    private readonly userDuelGameRepository: Repository<UserDuelGame>,

    private readonly dataSource: DataSource,
  ) { }

  // valida que el jugador que desea "unirse a la sala del duelo" no este previamente en otro duelo activo
  async validatePlayerExistsInRoomDuel(profileId: number) {

    // buscamos si el jugador existe en algun duelo que no este finalizado,
    // si es asi, ya se encuentra en una sala del duelo
    const playerInDuel = await this.userDuelGameRepository.find({
      where: {
        gameProfile: { id: profileId },
        finishedAt: IsNull()
      },
    });

    // retornamos true si el jugador ya existe en alguna sala de duelo
    if (playerInDuel.length > 0) return true;

    // de lo contrario retornamos false
    return false;
  }

  // funcion que retorna true o false si el jugador es el creador de la sala del duelo
  async validatePlayerCreatorRoomDuel(profileId: number, roomId: number) {

    const playerCreatorRoomDuel = await this.duelGameRepository.findOne({
      where: {
        id: roomId,
        createdBy: { id: profileId },
      }
    });

    // si el jugador no existe, no se encontro, por ende no es quien creo la sala del duelo
    if (!playerCreatorRoomDuel) return false;

    // de lo contrario si es el creador
    return true;
  }

  // funcion que permite unirse a los jugadores
  // esta operacion ocupa transaction + lock
  async joinDuel(id: number, profileId: string | number) {

    if (typeof profileId !== 'number') throw new NotFoundException('Debes tener tu perfil de jugador para poder unirte a un duelo.');

    let playerDuelCreator: boolean = false;

    await this.dataSource.transaction(async (manager) => {

      // 🔒 lock pesimista
      // primero verificar que realmente exista la sala del duelo
      const duelGame = await manager
        .createQueryBuilder(DuelGame, 'duel')
        .leftJoinAndSelect('duel.typeState', 'typeState')
        .where('duel.id = :id', { id })
        .setLock('pessimistic_write', undefined, ['duel'])  // FOR UPDATE
        .getOne();

      if (!duelGame) throw new NotFoundException('La sala del duelo al cual esta accediendo no existe.');
      // validacion del duelo ya cancelado
      if (duelGame.typeState.id === 4) throw new BadRequestException('No es posible unirse al duelo, este se encuentra cancelado.');
      // validacion de un duelo en "proceso de cancelacion"
      if (duelGame.typeState.id === 5) throw new BadRequestException('No es posible unirse a un duelo en proceso de cancelación.');

      // ❌ sala llena
      if (duelGame.playersJoined >= duelGame.playersNumber)
        throw new BadRequestException('La sala ya se encuentra llena, no se permiten más jugadores.');

      // ❌ evitar doble ingreso al mismo jugador
      const alreadyJoined = await manager.findOne(UserDuelGame, {
        where: {
          duelGame: { id: duelGame.id },
          gameProfile: { id: profileId }
        }
      });

      if (alreadyJoined) throw new BadRequestException('Ya estas unido a este duelo.');

      const playerInActiveDuel = await this.validatePlayerExistsInRoomDuel(profileId);

      if (playerInActiveDuel === true)
        throw new BadRequestException('Ya te encuentras unido a una sala de duelo activa, no es posible unirte a otra sala.');

      playerDuelCreator = await this.validatePlayerCreatorRoomDuel(profileId, id);

      // ✅ unir jugador
      await manager.save(UserDuelGame, {
        duelGame: { id: duelGame.id },
        gameProfile: { id: profileId },
        createdAt: new Date()
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

    return { ok: true, isRoomDuelCreator: playerDuelCreator, message: 'Te has unido exitosamente a la sala del duelo.' };
  }

  // verifica que el jugador que esta intentado finalizar el duelo realmente pertenesca al duelo
  private validatePlayerBelongsToDuel(profileId: number | string, players: { profileId: number }[]) {

    // si el resultado de la variable profileId no es un number quiere decir que el usuario no tiene el perfil de jugador creado
    if (typeof profileId !== 'number') throw new NotFoundException('No posees un perfil de jugador creado.');

    // toma los IDs de los jugadores involucrados en el duelo
    const playerIdExists = players.some(player => player.profileId === profileId);

    // si el ID del jugador que intenta finalizar el duelo existe pasa, si no existe, salta la validacion
    if (!playerIdExists) throw new BadRequestException('Jugador no pertenece al duelo. No es posible realizar la acción.');

  }

  // valida que el estado del duelo sea el correcto para poder finalizarlo
  private validateDuelState(duelGame: DuelGame) {

    // validamos que el duelo tenga todos los cupos llenos, osea que los duelistas ya estan en la sala para enfrentarse
    if (duelGame.typeState.id !== 2) throw new BadRequestException('El estado del duelo no es válido.');

  }

  // determina el ganador y perdedor del duelo
  private resolveDuelResult(playersDto: FinishDuelDto['players'], userDuelGame: UserDuelGame[]) {

    // se determina el ganador y perdedor del duelo
    // DATO: .filter() siempre devuelve un array, nunca null
    const whoWinnerTheDuel = playersDto.filter(player => player.finalLP > 0);
    const whoLoserTheDuel = playersDto.filter(player => player.finalLP === 0);

    // si el filter arroja mas de un "ganador" salta el error
    if (whoLoserTheDuel.length !== 1 || whoWinnerTheDuel.length !== 1) throw new BadRequestException('Resultado inválido.');

    // VINCULACION: aca vinculamos la entidad de UserDuelGame, por lo que si se desea hacer referencia a esta tabla 
    // en el transaction se debe usar o "winner" o "loser" para acceder a los campos de la tabla UserDuelGame.
    // relacionamos el DTO con las entidades de la BD
    const winner = userDuelGame.find(
      udg => udg.gameProfile.id === whoWinnerTheDuel[0].profileId,
    );

    const loser = userDuelGame.find(
      udg => udg.gameProfile.id === whoLoserTheDuel[0].profileId,
    );

    if (!winner || !loser) throw new BadRequestException('Los jugadores no pertenecen a este duelo.');

    // tomamos los LP de los jugadores y los retornamos
    const winnerDto = whoWinnerTheDuel[0];
    const loserDto = whoLoserTheDuel[0];

    return { winner, loser, winnerDto, loserDto };
  }

  // realiza la accion de finalizar el duelo y determinar un ganador
  async finishDuel(id: number, data: FinishDuelDto, profileId: string | number) {

    // 1-. validacion de seguridad
    this.validatePlayerBelongsToDuel(profileId, data.players);

    // 2-. obtener duelo
    const duelGame = await this.duelGameRepository.findOne({
      where: { id },
      relations: {
        typeState: true,
      }
    });

    // validamos que exista la sala del duelo
    if (!duelGame) throw new NotFoundException('La sala del duelo no existe.');

    // 3-. validar estado del duelo
    this.validateDuelState(duelGame);

    // 4-. obtener jugadores del duelo
    const userDuelGame = await this.userDuelGameRepository.find({
      where: {
        duelGame: { id },
      },
      // carga las relaciones foraneas de la tabla 
      // puesto que las relaciones en typeORM no se cargan solas
      relations: {
        gameProfile: true,
      }
    });

    // deben existir 2 jugadores para poder terminar un ganador del duelo
    // si no estan estos usuarios en la sala del duelo quiere decir que no estan registrados
    if (userDuelGame.length !== 2) throw new BadRequestException('No es posible determinar un ganador del duelo.');

    // transaction
    await this.dataSource.transaction(async (manager) => {

      // 5-. obetenemos mediante desestructuracion los datos correspondientes para asignar
      const { winner, loser, winnerDto, loserDto } = this.resolveDuelResult(data.players, userDuelGame);

      // carga el id 3 (finalizado) en la tabla DuelState
      const finishedState = await manager.preload(DuelState, { id: 3 });

      if (!finishedState) throw new NotFoundException('Estado del duelo no válido.');

      const finishedAt: Date = new Date();

      // se guarda al ganador
      winner.result = DuelResult.WIN;
      // los LP finales del duelo
      winner.finalLP = winnerDto.finalLP;
      // y la fecha y hora correspondiente
      winner.finishedAt = finishedAt;

      loser.result = DuelResult.LOSE;
      loser.finalLP = loserDto.finalLP;
      loser.finishedAt = finishedAt;

      duelGame.typeState = finishedState;  // finalizado
      duelGame.duelDateFinished = finishedAt;

      await manager.save(UserDuelGame, [winner, loser]);
      await manager.save(DuelGame, duelGame);
    });

    return { ok: true, message: 'Duelo finalizado.' };
  }

  // proceso de cancelacion del duelo (realizado solo por el creadro de la sala)
  async cancelDuel(duelId: number, profileId: number | string, cancelDuelDto: CancelDuelDto) {

    return await this.dataSource.transaction(async (manager) => {

      const { cancelReason } = cancelDuelDto;

      const duelGame = await manager.findOne(DuelGame, {
        where: { id: duelId },
        relations: ['createdBy']
      });

      if (!duelGame) throw new NotFoundException('No se encontro el duelo que se intenta cancelar.');
      //   solo uno de los jugadores que pertenecen al duelo pueden cancelar este mismo, 
      // en este caso "solo el creador mismo del duelo"
      if (duelGame.createdBy.id !== profileId) throw new BadRequestException('No puedes cancelar este duelo.');
      if (duelGame.playersJoined === 0) throw new NotFoundException('No se encontro ningún jugador dentro de la sala del duelo.');

      // aplicacion de 2/4 de las reglas de cancelacion de duelos.
      // 2-. Si hay 2 jugadores → pasa a VERIFYING (5).
      // 3-. Si hay 1 jugador → pasa directo a CANCELED (4).
      // decidimos el nuevo estado dependiendo de la cantidad de jugadores en la sala para ver si el duelo
      // pasa a ser cancelado inmediatamente o pasa a estado verificando
      const nextState = duelGame.playersJoined === 1 ? 4 : 5;

      let allowedState: number;
      (duelGame.playersJoined === 1) ? allowedState = 1 : allowedState = 2;

      // IMPORANTE: aqui se produce directamente la actualizacion y guardado del dato al instante
      // update atomico del DuelGame
      // 1️⃣ Update condicional atómico
      const updateResult = await manager
        .createQueryBuilder()
        .update(DuelGame)
        // set: actualiza a (los campos typeState y duelDateFinished)
        .set({
          typeState: { id: nextState },
          duelDateFinished: nextState === 4 ? new Date() : null,
          cancelReason
        })
        .where('id = :duelId', { duelId })
        // solo si el typeStateId es
        .andWhere('typeStateId = :allowedState', { allowedState })
        .execute();

      // 2️⃣ Si no afectó filas → ya no estaba en VERIFYING
      if (updateResult.affected === 0) throw new BadRequestException('El duelo ya no está en estado válido para cancelación.');

      const finishedAt: Date = new Date();

      // update atomico del UserDuelGame
      await manager
        .createQueryBuilder()
        .update(UserDuelGame)
        .set({
          finishedAt: finishedAt,
          result: nextState === 4 ? DuelResult.CANCELED : DuelResult.VERIFYING
        })
        .where('duelGameId = :duelId', { duelId })
        .execute();

      return { ok: true, message: 'Duelo en proceso de cancelación. Se debe realizar la confirmación.' };
    });
  }

  async dataPlayersInDuel(profileId: string | number, duelId: number) {

    // si el resultado de la variable profileId no es un number quiere decir que el usuario no tiene el perfil de jugador creado
    if (typeof profileId !== 'number') throw new NotFoundException('No posees un perfil de jugador creado.');

    // muestra de una sala del duelo, quien es el jugador que creo la sala y su oponente
    const dataPlayers = await this.userDuelGameRepository
      .createQueryBuilder('udg')
      .innerJoin(
        DuelGame,
        'dg',
        'udg."duelGameId" = dg.id'
      )
      .innerJoin(
        GameProfile,
        'gmp1',
        'gmp1.id = udg."gameProfileId"'
      )
      .leftJoin(
        UserDuelGame,
        'udg2',
        'udg2."duelGameId" = dg.id AND udg2."gameProfileId" <> gmp1.id'
      )
      .leftJoin(
        GameProfile,
        'gmp2',
        'gmp2.id = udg2."gameProfileId"'
      )
      .select([
        'dg.id AS "id"',
        'gmp1.id AS "creatorId"',
        'gmp1."nickName" AS "creatorNickName"',
        'gmp2.id AS "opponentId"',
        'gmp2."nickName" AS "opponentNickName"',
      ])
      .where('udg."duelGameId" = :duelGameId', { duelGameId: duelId })
      .andWhere('udg."gameProfileId" = dg."createdById"')
      .getRawOne();

    return dataPlayers;
  }

}
