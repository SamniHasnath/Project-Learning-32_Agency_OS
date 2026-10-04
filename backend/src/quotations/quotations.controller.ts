import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/auth-user';
import { PdfService } from '../pdf/pdf.service';
import {
  ConvertQuotationDto,
  CreateQuotationDto,
  ListQuotationsQuery,
  UpdateQuotationDto,
  UpdateQuotationStatusDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListQuotationsQuery) {
    return this.quotations.findAll(user.agencyId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.quotations.findOne(user.agencyId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuotationDto) {
    return this.quotations.create(user.agencyId, user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotations.update(user.agencyId, user.userId, id, dto);
  }

  @Patch(':id/status')
  changeStatus(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuotationStatusDto) {
    return this.quotations.changeStatus(user.agencyId, user.userId, id, dto);
  }

  @Post(':id/convert-to-invoice')
  convert(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ConvertQuotationDto) {
    return this.quotations.convertToInvoice(user.agencyId, user.userId, id, dto);
  }

  @ApiProduces('application/pdf')
  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const quotation = await this.quotations.findOne(user.agencyId, id);
    const buffer = await this.pdf.renderQuotation(quotation);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${quotation.number}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(buffer);
  }
}
