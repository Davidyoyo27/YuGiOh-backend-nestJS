import { Module } from '@nestjs/common';
import { GameProfileService } from './game_profile.service';
import { GameProfileController } from './game_profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { GameProfile } from './entities/game-profile.entity';
import { LocalStorageModule } from 'src/files/storage/local-storage.module';

@Module({
  controllers: [GameProfileController],
  providers: [GameProfileService],
  imports: [
    TypeOrmModule.forFeature([GameProfile]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    LocalStorageModule
  ]
})
export class GameProfileModule { }
