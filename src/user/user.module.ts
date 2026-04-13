import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { UserType } from '../user/entities/user-type.entity';
import { TokenReset } from '../user/entities/token-reset.entity';
import { LoginAttempts } from '../auth/entities/login-attempts.entity';
import { GameProfile } from '../game_profile/entities/game-profile.entity';

import { PassportModule } from '@nestjs/passport';
import { IsEmailUniqueConstraint } from './decorators/validators/is-email-unique.validator';
import { IsNickNameUniqueConstraint } from '../game_profile/decorators/validators/is-nickname-unique.validator';
import { EmailModule } from '../email/email.module'

@Module({
  controllers: [UserController],
  providers: [
    UserService, 
    // decoradores personalizados
    IsEmailUniqueConstraint,
    IsNickNameUniqueConstraint,
  ],
  imports: [
    TypeOrmModule.forFeature([ User, UserType, TokenReset, LoginAttempts, GameProfile ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    EmailModule,
  ],
  exports: [UserService]
})
export class UserModule {}
