import { Module } from '@nestjs/common';
import { PlayerStatisticsService } from './player_statistics.service';
import { PlayerStatisticsController } from './player_statistics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PlayerStatisticsRepository } from './repositories/player-statistics.repository';
import { GameProfile } from 'src/game_profile/entities/game-profile.entity';

@Module({
  controllers: [PlayerStatisticsController],
  providers: [
    PlayerStatisticsService, 
    PlayerStatisticsRepository
  ],
  imports: [

    TypeOrmModule.forFeature([GameProfile]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class PlayerStatisticsModule { }
