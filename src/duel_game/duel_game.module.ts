import { Module } from '@nestjs/common';
import { DuelGameService } from './duel_game.service';
import { DuelGameController } from './duel_game.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { DuelGame } from './entities/duel-game.entity';
import { DuelType } from './entities/duel-type.entity';
import { DuelState } from './entities/duel-state.entity';
import { GameProfile } from 'src/game_profile/entities/game-profile.entity';
import { UserDuelGame } from 'src/user_duel_game/entities/user_duel_game.entity';

import { IsRoomNameUniqueConstraint } from './decorators/validators/is-room-name-unique.validator';

@Module({
  controllers: [DuelGameController],
  providers: [
    DuelGameService,
    IsRoomNameUniqueConstraint
  ],
  imports: [
    TypeOrmModule.forFeature([ DuelGame, DuelType, DuelState, GameProfile, UserDuelGame ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class DuelGameModule {}
