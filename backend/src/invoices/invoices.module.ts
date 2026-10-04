import { Module } from '@nestjs/common';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';
import { PaymentsModule } from '../payments/payments.module';
import { PdfModule } from '../pdf/pdf.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [DocumentTemplatesModule, PaymentsModule, PdfModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
