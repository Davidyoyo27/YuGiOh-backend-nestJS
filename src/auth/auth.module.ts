import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { UserType } from 'src/user/entities/user-type.entity';
import { TokenReset } from 'src/user/entities/token-reset.entity';
import { UserSessions } from './entities/user-sessions.entity';
import { LoginAttempts } from './entities/login-attempts.entity';

import { UserModule } from 'src/user/user.module';
import { EmailModule } from 'src/email/email.module';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
  ],
  imports: [
    UserModule, // si AuthService usa UserService
    EmailModule,

    ConfigModule,

    TypeOrmModule.forFeature([ User, UserType, TokenReset, UserSessions, LoginAttempts ]),

    // PassportModule para que AuthGuard() funcione donde lo deseas ocupar
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) => {
        return {
          secret: ConfigService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '1h'
          }
        }
      }
    }),
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET,
    //   signOptions: {
    //     expiresIn: '1h'
    //   }
    // })
  ],
})
export class AuthModule { }
