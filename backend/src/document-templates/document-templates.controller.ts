import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { CurrentAgency } from '../auth/auth-user';
import { DocumentTemplatesService } from './document-templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(private readonly templates: DocumentTemplatesService) {}

  @ApiQuery({ name: 'type', enum: DocumentType, required: false })
  @Get()
  findAll(
    @CurrentAgency() agencyId: string,
    @Query('type', new ParseEnumPipe(DocumentType, { optional: true }))
    type?: DocumentType,
  ) {
    return this.templates.findAll(agencyId, type);
  }

  @Get(':id')
  findOne(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templates.findOne(agencyId, id);
  }

  @Post()
  create(@CurrentAgency() agencyId: string, @Body() dto: CreateTemplateDto) {
    return this.templates.create(agencyId, dto);
  }

  @Patch(':id')
  update(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templates.update(agencyId, id, dto);
  }

  @Post(':id/set-default')
  setDefault(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templates.setDefault(agencyId, id);
  }

  @Delete(':id')
  remove(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templates.remove(agencyId, id);
  }
}
