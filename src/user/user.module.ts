import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';

import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([ User ]),
  ],
  exports: [TypeOrmModule]
})
export class UserModule {}
