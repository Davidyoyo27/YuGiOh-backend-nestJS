import { Module } from '@nestjs/common';
import { GameProfileService } from './game_profile.service';
import { GameProfileController } from './game_profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { GameProfile } from '../game_profile/entities/game-profile.entity';
import { StorageModule } from 'src/storage/storage.module';
import { User } from 'src/user/entities/user.entity';

@Module({
  controllers: [GameProfileController],
  providers: [GameProfileService],
  imports: [
    TypeOrmModule.forFeature([GameProfile, User]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    StorageModule,
  ]
})
export class GameProfileModule { }
