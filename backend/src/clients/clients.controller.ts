import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentAgency } from '../auth/auth-user';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @ApiQuery({ name: 'search', required: false })
  @Get()
  findAll(@CurrentAgency() agencyId: string, @Query('search') search?: string) {
    return this.clients.findAll(agencyId, search);
  }

  @Get(':id')
  findOne(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clients.findOne(agencyId, id);
  }

  @Post()
  create(@CurrentAgency() agencyId: string, @Body() dto: CreateClientDto) {
    return this.clients.create(agencyId, dto);
  }

  @Patch(':id')
  update(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(agencyId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clients.remove(agencyId, id);
  }
}
