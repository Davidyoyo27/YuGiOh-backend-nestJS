import { Module } from '@nestjs/common';
import { PlayerStatisticsService } from './player_statistics.service';
import { PlayerStatisticsController } from './player_statistics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PlayerStatisticsRepository } from './repositories/player-statistics.repository';

@Module({
  controllers: [PlayerStatisticsController],
  providers: [
    PlayerStatisticsService, 
    PlayerStatisticsRepository
  ],
  imports: [

    TypeOrmModule.forFeature(),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class PlayerStatisticsModule { }
