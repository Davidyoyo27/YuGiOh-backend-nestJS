import { Module } from '@nestjs/common';
import { UserDuelGameService } from './user_duel_game.service';
import { UserDuelGameController } from './user_duel_game.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { UserDuelGame } from './entities/user_duel_game.entity';
import { GameProfile } from 'src/game_profile/entities/game-profile.entity';
import { DuelGame } from 'src/duel_game/entities/duel-game.entity';

@Module({
  controllers: [UserDuelGameController],
  providers: [UserDuelGameService],
  imports: [

    TypeOrmModule.forFeature([ UserDuelGame, GameProfile, DuelGame ]),
    
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class UserDuelGameModule {}
