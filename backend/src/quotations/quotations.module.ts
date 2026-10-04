import { Module } from '@nestjs/common';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';
import { PdfModule } from '../pdf/pdf.module';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [DocumentTemplatesModule, PdfModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
