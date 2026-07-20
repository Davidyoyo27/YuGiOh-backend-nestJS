import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ]
})
export class StorageModule { }
