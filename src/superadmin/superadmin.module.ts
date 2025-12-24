import { Module } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { UserType } from 'src/user/entities/user-type.entity';
import { User } from 'src/user/entities/user.entity';
import { UserSessions } from 'src/auth/entities/user-sessions.entity';
import { LoginAttempts } from 'src/auth/entities/login-attempts.entity';
import { IpRateLimit } from 'src/auth/entities/login-ip-rate-limit.entity';

import { EmailModule } from 'src/email/email.module';

@Module({
  controllers: [SuperadminController],
  providers: [SuperadminService],
  imports:[
    EmailModule,
    
    TypeOrmModule.forFeature([User, UserType, UserSessions, LoginAttempts, IpRateLimit]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class SuperadminModule {}
