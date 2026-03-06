import { BadRequestException, Injectable } from '@nestjs/common';
import { PlayerStatisticsRepository } from './repositories/player-statistics.repository';
import { PlayerStatisticsResponseDto } from './dto/player-statistics-response.dto';
import { PlayerVsStatisticsResponseDto } from './dto/player-vs-statistics-response.dto';

@Injectable()
export class PlayerStatisticsService {

  constructor(
    private readonly playerStatisticsRepository: PlayerStatisticsRepository,
  ) { }

  // trae todos los datos del jugador referente a sus estadisticas
  async getAllRecordPlayer(profileId: string | number): Promise<PlayerStatisticsResponseDto> {

    if (typeof profileId !== 'number')
      throw new BadRequestException('Debes tener un perfil de jugador creado para poder visualizar tus estadisticas.');

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
      throw new BadRequestException('Debes tener un perfil de jugador creado para poder visualizar tus estadisticas.');

    const statisticsPlayerVS = await this.playerStatisticsRepository.getStatisticsPlayerVSPlayer(profileId, playerId);

    return {
      totalDuels: statisticsPlayerVS.total_duels,
      winsPlayer1: statisticsPlayerVS.wins_player1,
      winsPlayer2: statisticsPlayerVS.wins_player2,
      ties: statisticsPlayerVS.draws,
      percentagePlayer1: statisticsPlayerVS.percentage_player1,
      percentagePlayer2: statisticsPlayerVS.percentage_player2
    };
  }

}
