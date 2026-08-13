import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { PlayerStatisticsService } from './player_statistics.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AddStatisticsPlayerDto } from './dto/add-statistics-player.dto';
import { appConfig } from 'src/config/app.config';

@Controller('statistics')
export class PlayerStatisticsController {

  private readonly hoursPerSession = appConfig.statistics.defaultHoursPerSession;
  private readonly months = appConfig.statistics.defaultMonths;

  constructor(readonly playerStatisticsService: PlayerStatisticsService) { }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('player-statistics')
  getAllRecordPlayer(
    @CurrentUserId('profileId') profileId: string | number,
  ) {
    return this.playerStatisticsService.getAllRecordPlayer(profileId);
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('playerVSplayer-statistics/:id')
  getRecordPlayerVsPlayer(
    @CurrentUserId('profileId') profileId: string | number,
    @Param('id', ParseIntPipe) playerId: number, 
  ){
    return this.playerStatisticsService.getRecordPlayerVsPlayer(profileId, playerId);
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(3, 4)
  @Get('all-players')
  getAllPlayers(){
    return this.playerStatisticsService.getAllPlayers();
  }

  // endpoint para agregar victorias, derrotas y/o empates
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(4)
  @Patch('administrative-player-statistics/:id')  // agregar el id del jugador a procesar aqui
  addVictoriesOrDefeatsToPlayers(
    @Body() addStatisticsPlayerDto: AddStatisticsPlayerDto,
    @CurrentUserId('id') adminId: string,
    @Param('id', ParseIntPipe) playerId: number
  ){
    return this.playerStatisticsService.addVictoriesOrDefeatsToPlayers(addStatisticsPlayerDto, adminId, playerId);
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('user-lasts-duels')
  getStatisticsUserLastsDuels(
    @CurrentUserId('profileId') profileId: string | number
  ){
    return this.playerStatisticsService.getStatisticsUserLastsDuels(profileId, this.hoursPerSession, this.months);
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('player-history-duels')
  getPlayerHistoryDuels(
    @CurrentUserId('profileId') profileId: string | number
  ){
    return this.playerStatisticsService.getPlayerHistoryDuels(profileId);
  }

}
