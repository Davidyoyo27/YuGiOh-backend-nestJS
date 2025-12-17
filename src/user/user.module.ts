import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserType } from './entities/user-type.entity';
import { TokenReset } from './entities/token-reset.entity';
import { LoginAttempts } from 'src/auth/entities/login-attempts.entity';

import { PassportModule } from '@nestjs/passport';
import { IsEmailUniqueConstraint } from './decorators/validators/is-email-unique.validator';
import { IsNickNameUniqueConstraint } from './decorators/validators/is-nickname-unique.validator';
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
    TypeOrmModule.forFeature([ User, UserType, TokenReset, LoginAttempts ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    EmailModule,
  ],
  exports: [UserService]
})
export class UserModule {}
