import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { PromotionsController } from './promotions.controller';
import { PromotionsRepository } from './promotions.repository';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [AuditModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsRepository],
})
export class PromotionsModule {}
