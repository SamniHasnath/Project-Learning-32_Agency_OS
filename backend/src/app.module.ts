import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentTemplatesModule } from './document-templates/document-templates.module';
import { InvoicesModule } from './invoices/invoices.module';
import { StatusSchedulerService } from './jobs/status-scheduler.service';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 300) },
    ]),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ProjectsModule,
    DocumentTemplatesModule,
    QuotationsModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    StatusSchedulerService,
    // Guards run in registration order: rate limiting first, then JWT (registered in AuthModule).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
