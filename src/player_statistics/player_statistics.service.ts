import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { DuelGame } from '../duel_game/entities/duel-game.entity';
import { UserDuelGame } from '../user_duel_game/entities/user_duel_game.entity';
import { GameProfile } from '../game_profile/entities/game-profile.entity';
import { PlayerStatsAudit } from '../audit/entities/player-stats-audit.entity';

import { GetAllPlayersResponseDto } from './dto/all-players-response.dto';
import { AddStatisticsPlayerDto } from './dto/add-statistics-player.dto';
import { PlayerStatisticsResponseDto } from './dto/player-statistics-response.dto';
import { PlayerVsStatisticsResponseDto } from './dto/player-vs-statistics-response.dto';

import { PlayerStatisticsRepository } from './repositories/player-statistics.repository';

import { DuelResult } from 'src/common/utils/duel-result';
import { ManualAction } from 'src/common/utils/update-stats-manual-action';


@Injectable()
export class PlayerStatisticsService {

  constructor(
    private readonly playerStatisticsRepository: PlayerStatisticsRepository,

    private readonly dataSource: DataSource,

    @InjectRepository(GameProfile)
    private readonly playerGameProfileRepository: Repository<GameProfile>,
  ) { }

  // trae todos los datos del jugador referente a sus estadisticas
  async getAllRecordPlayer(profileId: string | number): Promise<PlayerStatisticsResponseDto> {

    if (typeof profileId !== 'number')
      throw new BadRequestException('Debes tener un perfil de jugador creado para poder visualizar tus estadísticas.');

    const statisticsPlayer = await this.playerStatisticsRepository.getStatisticsPlayer(profileId);

    return {
      totalDuelGames: statisticsPlayer.totalpartidasduelos,
      victories: statisticsPlayer.victorias,
      defeats: statisticsPlayer.derrotas,
      ties: statisticsPlayer.empates,
      canceled: statisticsPlayer.cancelados,
      verifying: statisticsPlayer.verificando,
      percentageVictories: statisticsPlayer.percentage_victorias,
      percentageDefeats: statisticsPlayer.percentage_derrotas,
      percentageTies: statisticsPlayer.percentage_empates,
    };
  }

  // trae todos los datos del jugador referente a sus estadisticas Vs algun jugador X
  async getRecordPlayerVsPlayer(profileId: string | number, playerId: number): Promise<PlayerVsStatisticsResponseDto> {

    if (typeof profileId !== 'number')
      throw new BadRequestException('Debes tener un perfil de jugador creado para poder visualizar tus estadísticas.');

    const statisticsPlayerVS = await this.playerStatisticsRepository.getStatisticsPlayerVSPlayer(profileId, playerId);

    return {
      nickNameOpponent: statisticsPlayerVS.nickname_opponent,
      totalDuels: statisticsPlayerVS.total_duels,
      winsPlayer1: statisticsPlayerVS.wins_player1,
      winsPlayer2: statisticsPlayerVS.wins_player2,
      ties: statisticsPlayerVS.draws,
      percentagePlayer1: statisticsPlayerVS.percentage_wins_player1,
      percentagePlayer2: statisticsPlayerVS.percentage_wins_player2,
      percentageDrawPlayers: statisticsPlayerVS.percentage_draw_players
    };
  }

  // retorna a todos los duelistas con su cantidad de victorias, derrotas, etc.
  async getAllPlayers(): Promise<GetAllPlayersResponseDto[]> {

    const allPlayers = await this.playerStatisticsRepository.getAllPlayers();

    return allPlayers.map(player => ({
      nickName: player.nickname,
      victories: Number(player.victorias),
      defeats: Number(player.derrotas),
      ties: Number(player.empate),
      canceleds: Number(player.cancelado),
      verifiyings: Number(player.verificando),
      totalGames: Number(player.totalpartidas)
    }));
  }

  // proceso de insertar victorias, derrotas o empates a los jugadores en el pasado
  async addVictoriesOrDefeatsToPlayers(addStatisticsPlayerDto: AddStatisticsPlayerDto, adminId: string, playerId: number) {

    const playerExist = await this.playerGameProfileRepository.exists({
      where: { id: playerId }
    });

    if (!playerExist) throw new NotFoundException('El jugador ingresado no existe.');

    await this.generateDataToInsertStatistics(addStatisticsPlayerDto, adminId, playerId);

    return { ok: true, message: 'Datos insertados correctamente.' };
  }

  // inserta victoria, derrota o empate
  async generateDataToInsertStatistics(addStatisticsPlayerDto: AddStatisticsPlayerDto, adminId: string, playerId: number) {

    const { amount, date, time, playerOpponent, reason } = addStatisticsPlayerDto;
    let dateAdded: Date;
    dateAdded = new Date(`${date}T${time}`);
    const manualBatchId: string = `import-history-${Date.now()}`;

    if (!playerOpponent || playerOpponent <= 0) throw new BadRequestException('Jugador oponente inválido.');
    if (playerId === playerOpponent) throw new BadRequestException('Un jugador no puede jugar contra sí mismo.');
    if (amount <= 0) throw new BadRequestException('Cantidad de partidas ingresada inválida.');
    if (dateAdded > new Date()) throw new BadRequestException('No puedes insertar duelos en el futuro.');
    // en caso de que pudiera mandarse esta fecha 2026-99-99
    if (isNaN(dateAdded.getTime())) throw new BadRequestException('Fecha inválida.');

    // se crean la cantidad de "salas de duelos" a ser insertados posteriormente
    const registersDuelGame = Array.from({ length: amount }, (_, index) => ({
      playersNumber: 2,
      playersJoined: 2,
      duelDateCreated: dateAdded,
      duelDateFinished: dateAdded,
      typeDuel: { id: 1 },  // duelo 1vs1
      typeState: { id: 3 },  // finalizado
      createdBy: { id: playerId },  // se asigna el jugador principal de la insercion de datos como el creador de la sala
      roomName: `manual-room ${index + 1}`,
      isManual: true,
      manualBatchId,
    }));

    const playerStats = await this.playerStatisticsRepository.getStatisticsPlayer(playerId);
    const { victorias, derrotas, empates } = playerStats;

    // transaction
    return await this.dataSource.transaction(async (manager) => {

      // exists mejor y mas rapido que findBy
      const opponentExists = await manager.exists(GameProfile, {
        where: { id: playerOpponent }
      })

      if (!opponentExists) throw new BadRequestException('El jugador oponente no existe.');

      // se crea el repositorio para acceder a el mediante el transaction
      const duelGameRepository = manager.getRepository(DuelGame);
      // se crean los registros para ser guardados
      const entities = duelGameRepository.create(registersDuelGame);
      // se guardan los registros
      const savedRoomsDuel = await duelGameRepository.save(entities);

      // mapeo del resultado segun como se inserte DuelResult
      const duelResultMap = {
        [DuelResult.WIN]: {
          player: DuelResult.WIN,
          opponent: DuelResult.LOSE,
        },
        [DuelResult.LOSE]: {
          player: DuelResult.LOSE,
          opponent: DuelResult.WIN,
        },
        [DuelResult.DRAW]: {
          player: DuelResult.DRAW,
          opponent: DuelResult.DRAW,
        },
      };

      // mapeo de la accion segun insercion de DuelResult
      const actionResultMap = {
        [DuelResult.WIN]: {
          player: ManualAction.ADD_WIN,
          oldValue: victorias,
        },
        [DuelResult.LOSE]: {
          player: ManualAction.ADD_LOSE,
          oldValue: derrotas,
        },
        [DuelResult.DRAW]: {
          player: ManualAction.ADD_DRAW,
          oldValue: empates,
        },
      };

      const resultConfig = duelResultMap[addStatisticsPlayerDto.duelResult];
      const resultConfigAction = actionResultMap[addStatisticsPlayerDto.duelResult];

      if (!resultConfig) throw new BadRequestException('duelResult inválido.');

      // creacion de los datos por cada sala del duelo creada (asignacion de ganador y perdedor)
      // estos son los registros que se crean en UserDuelGame
      const userDuelGames = savedRoomsDuel.flatMap((duel) => [
        // jugador A → victoria
        {
          result: resultConfig.player,
          finalLP: resultConfig.player === DuelResult.WIN ? 8000 : 0,
          createdAt: dateAdded,
          finishedAt: dateAdded,
          duelGame: { id: duel.id },
          gameProfile: { id: playerId },
          manualBatchId,
        },
        // jugador B → derrota
        {
          result: resultConfig.opponent,
          finalLP: resultConfig.opponent === DuelResult.WIN ? 8000 : 0,
          createdAt: dateAdded,
          finishedAt: dateAdded,
          duelGame: { id: duel.id },
          gameProfile: { id: playerOpponent },
          manualBatchId,
        },
      ]);

      // insert masivo (rapido)
      await manager.insert(UserDuelGame, userDuelGames);

      // insercion a la tabla de auditoria
      await manager.insert(PlayerStatsAudit, {
        profileId: playerId,
        action: resultConfigAction.player,
        amount,
        oldValue: resultConfigAction.oldValue,
        newValue: resultConfigAction.oldValue + amount,
        reason,
        performedBy: { id: adminId },
      });

      return {
        duelsCreated: savedRoomsDuel.length,
        relationsCreated: userDuelGames.length,
      };
    });

  }

  async getStatisticsUserLastsDuels(profileId: string | number, hoursPerSession: number, months: number) {

    if (typeof profileId !== 'number')
      throw new BadRequestException('Debes tener un perfil de jugador creado para poder visualizar tus estadísticas.');

    const statisticsLastDuels = await this.playerStatisticsRepository.lastsDuelsResultsByUser(profileId, hoursPerSession, months);

    return statisticsLastDuels;
  }

  async getPlayerHistoryDuels(profileId: string | number) {

    if (typeof profileId !== 'number')
      throw new BadRequestException('Debes tener un perfil de jugador creado para poder visualizar tus estadísticas.');

    const statisticsHistoryPlayerDuels = await this.playerStatisticsRepository.getHistoryDuelsPlayer(profileId);

    return statisticsHistoryPlayerDuels;
  }

}
