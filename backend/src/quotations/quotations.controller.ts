import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuotationsService } from './quotations.service';

@Controller('api/quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  findAll() {
    return this.quotationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.quotationsService.create(data);
  }

  @Post(':id/convert')
  convertToInvoice(@Param('id') id: string) {
    return this.quotationsService.convertToInvoice(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.quotationsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
