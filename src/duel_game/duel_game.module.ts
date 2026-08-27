import { Module } from '@nestjs/common';
import { DuelGameService } from './duel_game.service';
import { DuelGameController } from './duel_game.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { DuelGame } from '../duel_game/entities/duel-game.entity';
import { DuelType } from '../duel_game/entities/duel-type.entity';
import { DuelState } from '../duel_game/entities/duel-state.entity';
import { UserDuelGame } from '../user_duel_game/entities/user_duel_game.entity';

import { IsRoomNameUniqueConstraint } from './decorators/validators/is-room-name-unique.validator';

@Module({
  controllers: [DuelGameController],
  providers: [
    DuelGameService,
    IsRoomNameUniqueConstraint
  ],
  imports: [
    TypeOrmModule.forFeature([ DuelGame, DuelType, DuelState, UserDuelGame ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class DuelGameModule {}
