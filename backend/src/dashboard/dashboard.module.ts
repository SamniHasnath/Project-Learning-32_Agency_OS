import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ClientsModule } from '../clients/clients.module';
import { ProjectsModule } from '../projects/projects.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [ClientsModule, ProjectsModule, InvoicesModule, QuotationsModule, PaymentsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

