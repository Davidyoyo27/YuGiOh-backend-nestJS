import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { GameProfileModule } from './game_profile/game_profile.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DuelGameModule } from './duel_game/duel_game.module';
import { UserDuelGameModule } from './user_duel_game/user_duel_game.module';
import { PlayerStatisticsModule } from './player_statistics/player_statistics.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','uploads'),
      serveRoot: '/uploads',
    }),

    UserModule,
    AuthModule,
    AdminModule,
    SuperadminModule,
    GameProfileModule,
    DuelGameModule,
    UserDuelGameModule,
    PlayerStatisticsModule,
    AuditModule,
  ],
})
export class AppModule {}
