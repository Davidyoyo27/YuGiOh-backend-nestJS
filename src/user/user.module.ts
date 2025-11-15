import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserType } from './entities/user-type.entity';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IsEmailUniqueConstraint } from './decorators/validators/is-email-unique.validator';
import { IsNickNameUniqueConstraint } from './decorators/validators/is-nickname-unique.validator';
import { EmailModule } from '../email/email.module'

@Module({
  controllers: [UserController],
  providers: [
    UserService, 
    JwtStrategy,
    // decoradores personalizados
    IsEmailUniqueConstraint,
    IsNickNameUniqueConstraint,
  ],
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([ User, UserType ]),

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
    EmailModule,
  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule, UserService]
})
export class UserModule {}
