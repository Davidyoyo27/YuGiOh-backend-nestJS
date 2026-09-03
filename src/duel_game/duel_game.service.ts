import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { DuelGame } from '../duel_game/entities/duel-game.entity';
import { DuelState } from '../duel_game/entities/duel-state.entity';
import { UserDuelGame } from '../user_duel_game/entities/user_duel_game.entity';
import { DuelResult } from 'src/common/utils/duel-result';
import { DuelType } from './entities/duel-type.entity';
import { GameProfile } from 'src/game_profile/entities/game-profile.entity';

import { CreateDuelGameDto } from './dto/create-duel_game.dto';
import { ConfirmedDuelCanceledDto } from './dto/confirmed-duel-canceled.dto';

import { isNumberPairPositive } from 'src/common/utils/functions';
import { DataSource } from 'typeorm';

@Injectable()
export class DuelGameService {

  constructor(
    @InjectRepository(DuelGame)
    private readonly duelGameRepository: Repository<DuelGame>,

    @InjectRepository(DuelType)
    private readonly userTypeDuel: Repository<DuelType>,

    private readonly dataSource: DataSource,
  ) { }

  async createDuelGame(createDuelGameDto: CreateDuelGameDto, profileId: string | number) {

    const { playersNumber, typeDuel, roomName } = createDuelGameDto;

    if (typeof profileId !== 'number') throw new BadRequestException('Debes tener tu perfil de jugador para poder crear duelos.');

    if (playersNumber < 2)
      throw new BadRequestException('El valor minimo de jugadores debe ser 2 para poder crear el duelo.');

    if (!isNumberPairPositive(playersNumber))
      throw new BadRequestException('La cantidad de jugadores debe ser un numero par.');

    // validaciones para que el torneo y duelo tag, no disponibles por ahora
    if (typeDuel === 2) throw new BadRequestException('Tipo de duelo Torneo no esta disponible actualmente.');
    if (typeDuel === 3) throw new BadRequestException('Tipo de duelo Tag no esta disponible actualmente');

    const duel = await this.duelGameRepository.create({
      playersNumber,
      duelDateCreated: new Date(),
      typeDuel: { id: typeDuel },
      typeState: { id: 1 },  // 1 = esperando
      createdBy: { id: profileId },
      roomName
    });

    await this.duelGameRepository.save(duel);

    return { ok: true, message: 'Sala del duelo creada correctamente.' };
  }

  // retorna todos los duelos con estado "esperando"
  async findAllAvailableDuels() {

    const rooms = await this.duelGameRepository
      .createQueryBuilder('dg')
      .innerJoin(
        GameProfile,
        'gp',
        'gp.id = dg.createdById'
      )
      .innerJoin(
        DuelType,
        'dt',
        'dt.id = dg.typeDuelId'
      )
      .innerJoin(
        DuelState,
        'ds',
        'ds.id = dg.typeStateId'
      )
      .select([
        'dg.id',
        'dg.roomName',
        'dg.playersNumber',
        'dg.playersJoined',
        'gp.nickName',
        'dt.description',
        'dg.duelDateCreated',
        'ds.stateName'
      ])
      // Filtro
      .where('dg.typeStateId = 1')
      .orderBy('dg.duelDateCreated', 'DESC')
      .getRawMany();

    const duelsFiltered = rooms.map(items => {
      return {
        id: items.dg_id,
        roomName: items.dg_roomName,
        type: items.dt_description.split(' ')[0],
        playersJoined: items.dg_playersJoined,
        maxPlayers: items.dg_playersNumber,
        roomCreatedBy: items.gp_nickName,
        duelDateCreated: items.dg_duelDateCreated,
        status: items.ds_stateName
      }
    });

    return duelsFiltered;
  }

  // muestra todos los duelos cancelados en espera por ser aceptados filtrados por jugador
  async findAllCanceledDuels(profileId: string | number) {

    if (typeof profileId !== 'number') throw new NotFoundException('No tienes un perfil de jugador creado.');

    const duelGame = await this.duelGameRepository.find({
      where: {
        // por estado "verificando"
        typeState: { id: 5 },
        // solo los correspondientes a el usuario logeado
        createdBy: { id: profileId }
      }
    });

    // si no se encuentra ningun duelo cancelado hacia el jugador muestra la siguiente validacion
    if (duelGame.length === 0) return { ok: true, message: 'No se encontro ningún duelo cancelado.' };

    const duelsCanceled = duelGame.map(duels => {
      return {
        id: duels.id,
        typeDuel: duels.typeDuel.description.split(' ')[0],
        dateFinished: duels.duelDateFinished,
        typeState: duels.typeState.stateName,
        canceledBy: duels.createdBy.nickName,
        cancelReason: duels.cancelReason,
      }
    });

    return duelsCanceled;
  }

  async resultCancelDuel(duelRoomId: number, body: ConfirmedDuelCanceledDto, profileId: string | number) {

    return await this.dataSource.transaction(async (manager) => {

      if (typeof profileId !== 'number') throw new NotFoundException('No tienes un perfil de jugador creado.');

      const duelGame = await manager.findOne(DuelGame, {
        where: { id: duelRoomId },
        relations: ['typeState', 'createdBy']
      });

      if (!duelGame) throw new NotFoundException('No se encontro un duelo cancelado en espera.');
      // el estado del duelo debe ser necesariamente 5 "verificando" para poder acceder a cancelar este mismo
      if (duelGame.typeState.id !== 5) throw new BadRequestException('No es posible proceder por el estado del duelo.');

      const playersInDuel = await manager.find(UserDuelGame, {
        where: { duelGame: { id: duelRoomId } },
        relations: ['gameProfile']
      });

      if (!playersInDuel.length) throw new BadRequestException('No hay jugadores asociados al duelo.');
      // el creador del duelo y quien inicio la cancelacion NO PUEDE APROBAR esta misma
      if (duelGame.createdBy.id === profileId && playersInDuel.length === 2)
        throw new BadRequestException('El creador de la sala del duelo no puede confirmar la cancelación.');

      // 3️⃣ Validar que el jugador pertenece al duelo
      const currentPlayer = playersInDuel.find(
        player => player.gameProfile.id === profileId
      );

      if (!currentPlayer) throw new ForbiddenException('No perteneces a este duelo.');

      const duelCanceledState = await manager.findOne(DuelState, { where: { id: 4 } });
      if (!duelCanceledState) throw new NotFoundException('No existe el estado del duelo requerido.');

      const dateFinished = new Date();

      // si es true
      if (body.confirmationCanceledDuel) {
        // actualiza el registro de la sala del duelo
        const updateResult = await manager
          .createQueryBuilder()
          .update(DuelGame)
          .set({
            typeState: duelCanceledState,  // cancelado
            duelDateFinished: dateFinished,
          })
          .where('id = :duelRoomId', { duelRoomId })
          .andWhere('typeStateId = :currentState', { currentState: 5 })  // solo si esta en verificando
          .execute();

        // 2️⃣ Si no afectó filas → ya no estaba en VERIFYING
        if (updateResult.affected === 0) throw new BadRequestException('El duelo ya no está en estado válido para cancelación.');

        // actualiza los registros de los jugadores ya dentro de la sala
        await manager
          .createQueryBuilder()
          .update(UserDuelGame)
          .set({
            result: DuelResult.CANCELED,
            finishedAt: dateFinished,
          })
          .where('duelGameId = :duelRoomId', { duelRoomId })
          // Solo actualiza jugadores que estén en estado VERIFYING.
          .andWhere('result = :currentResult', { currentResult: DuelResult.VERIFYING })
          .execute();

        return { ok: true, message: 'Resultado procesado correctamente.' };
      }

      // si es false
      // si hay dos jugadores se debe identificar cual es el creador y cual es el oponente
      const creatorId = duelGame.createdBy.id;

      const creator = playersInDuel.find(
        player => player.gameProfile.id === creatorId
      );

      const opponent = playersInDuel.find(
        player => player.gameProfile.id !== creatorId
      );

      if (!creator || !opponent) throw new BadRequestException('Error determinando a los jugadores.');

      // realizamos la actualizacion de la sala del duelo
      const duelUpdate = await manager.createQueryBuilder()
        .update(DuelGame)
        .set({
          typeState: duelCanceledState,
          duelDateFinished: dateFinished,
        })
        .where('id = :duelRoomId', { duelRoomId })
        .andWhere('typeStateId = :currentResult', { currentResult: 5 })  // verificando
        .execute();


      // 2️⃣ Si no afectó filas → ya no estaba en VERIFYING
      if (duelUpdate.affected === 0) throw new BadRequestException('El duelo ya no está en estado válido para cancelación.');

      // realizamos la actualizacion correspondiente a los jugadores del duelo en este caso asignando Victoria y Derrota a quien corresponda
      // para esto como son updates atomicos no es posible hacer ambos a la vez entonces se haran dos: uno para el ganador y otro para el perdedor
      // Creador pierde
      await manager.createQueryBuilder()
        .update(UserDuelGame)
        .set({
          result: DuelResult.LOSE,
          finishedAt: dateFinished,
        })
        .where('duelGameId = :duelRoomId', { duelRoomId })
        .andWhere('gameProfileId = :creatorId', { creatorId: creator.gameProfile.id })
        .andWhere('result = :currentState', { currentState: DuelResult.VERIFYING })
        .execute();

      // Oponente gana
      await manager.createQueryBuilder()
        .update(UserDuelGame)
        .set({
          result: DuelResult.WIN,
          finishedAt: dateFinished,
        })
        .where('duelGameId = :duelRoomId', { duelRoomId })
        .andWhere('gameProfileId = :opponentId', { opponentId: opponent.gameProfile.id })
        .andWhere('result = :currentState', { currentState: DuelResult.VERIFYING })
        .execute();

      return { ok: true, message: 'Resultado procesado correctamente.' };
    });
  }

  async typesDuels() {
    return this.userTypeDuel
      .createQueryBuilder('dt')
      .select([
        'dt.id',
        'dt.typeName'
      ])
      .getMany();
  }

}
