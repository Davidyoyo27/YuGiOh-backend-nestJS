import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { UserDuelGameService } from './user_duel_game.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

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

}
