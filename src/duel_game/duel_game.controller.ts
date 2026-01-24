import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DuelGameService } from './duel_game.service';
import { CreateDuelGameDto } from './dto/create-duel_game.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

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
  
}
