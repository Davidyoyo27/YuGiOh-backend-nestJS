import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerStatsAudit } from '../audit/entities/player-stats-audit.entity';

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  imports: [
    TypeOrmModule.forFeature([PlayerStatsAudit]),
  ]
})
export class AuditModule {}
