import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PlayerStatisticsService } from './player_statistics.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('statistics')
export class PlayerStatisticsController {
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

}
