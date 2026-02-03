import { Controller, Post, Param, UseGuards, Body, ParseIntPipe } from '@nestjs/common';
import { UserDuelGameService } from './user_duel_game.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { FinishDuelDto } from './dto/finish-duel.dto';

@Controller('user-duel-game')
export class UserDuelGameController {
  constructor(private readonly userDuelGameService: UserDuelGameService) {}

  // endpoint donde los jugadores se unen al duelo
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Post(':id/join')
  joinDuel(
    @Param('id') id: number, // id de la "sala del duelo/partida creada por otro jugador"
    @CurrentUserId('id') userId: string // id del jugador que se une
  ) {
    return this.userDuelGameService.joinDuel(id, userId);
  }

  // endpoint de finalizacion del duelo
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Post(':id/duel-finished')
  finishDuel(
    @Param('id', ParseIntPipe) id: number,  // @Param identidad del recurso
    @CurrentUserId('profileId') profileId: string | number,  // @Body datos de la acción
    @Body() body: FinishDuelDto,
  ){
    return this.userDuelGameService.finishDuel(id, body, profileId);
  }

}
