import { Module } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserType } from 'src/user/entities/user-type.entity';
import { User } from 'src/user/entities/user.entity';
import { EmailModule } from 'src/email/email.module';
import { PassportModule } from '@nestjs/passport';
import { UserSessions } from 'src/auth/entities/user-sessions.entity';

@Module({
  controllers: [SuperadminController],
  providers: [SuperadminService],
  imports:[
    EmailModule,
    
    TypeOrmModule.forFeature([User, UserType, UserSessions]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class SuperadminModule {}
