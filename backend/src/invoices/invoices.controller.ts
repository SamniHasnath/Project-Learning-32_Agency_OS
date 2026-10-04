import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/auth-user';
import { PaymentsService } from '../payments/payments.service';
import { PdfService } from '../pdf/pdf.service';
import {
  CreateInvoiceDto,
  ListInvoicesQuery,
  UpdateInvoiceDto,
  UpdateInvoiceStatusDto,
} from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly payments: PaymentsService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListInvoicesQuery) {
    return this.invoices.findAll(user.agencyId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.findOne(user.agencyId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user.agencyId, user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(user.agencyId, user.userId, id, dto);
  }

  @Patch(':id/status')
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoices.changeStatus(user.agencyId, user.userId, id, dto);
  }

  /** Payment history for one invoice. */
  @Get(':id/payments')
  async listPayments(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.invoices.findOne(user.agencyId, id);
    return this.payments.findAll(user.agencyId, id);
  }

  @ApiProduces('application/pdf')
  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const invoice = await this.invoices.findOne(user.agencyId, id);
    const buffer = await this.pdf.renderInvoice(invoice);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${invoice.number}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(buffer);
  }
}
