import { Controller, Get, Post, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { DuelGameService } from './duel_game.service';
import { CreateDuelGameDto } from './dto/create-duel_game.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { ConfirmedDuelCanceledDto } from './dto/confirmed-duel-canceled.dto';

@Controller('duel-game')
export class DuelGameController {
  constructor(private readonly duelGameService: DuelGameService) { }

  // crear el duelo
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Post('create-duel')
  createDuelGame(
    @Body() createDuelGameDto: CreateDuelGameDto,
    @CurrentUserId('id') userId: string
  ) {
    return this.duelGameService.createDuelGame(createDuelGameDto, userId);
  }

  // retornar todos los duelos disponibles para que un duelista pueda unirse
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('duel-games-created')
  findAllAvailableDuels() {
    return this.duelGameService.findAllAvailableDuels();
  }

  // retorna todos los duelos que fueron cancelados en los cuales esta asociado el jugador
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Get('canceled-duels')
  findAllCanceledDuels(
    @CurrentUserId('profileId') profileId: string | number,
  ) {
    return this.duelGameService.findAllCanceledDuels(profileId);
  }

  // recibe true(aceptar) o false(rechazar) para confirmar la cancelacion del duelo
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(2)
  @Post('confirmation-canceled-duels/:id')
  resultCancelDuel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConfirmedDuelCanceledDto,
    @CurrentUserId('profileId') profileId: string | number
  ) {
    return this.duelGameService.resultCancelDuel(id, body, profileId);
  }

}
