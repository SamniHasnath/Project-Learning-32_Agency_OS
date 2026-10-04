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
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @ApiQuery({ name: 'clientId', required: false })
  @Get()
  findAll(
    @CurrentAgency() agencyId: string,
    @Query('clientId', new ParseUUIDPipe({ optional: true })) clientId?: string,
  ) {
    return this.projects.findAll(agencyId, clientId);
  }

  @Get(':id')
  findOne(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.findOne(agencyId, id);
  }

  @Post()
  create(@CurrentAgency() agencyId: string, @Body() dto: CreateProjectDto) {
    return this.projects.create(agencyId, dto);
  }

  @Patch(':id')
  update(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(agencyId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentAgency() agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.remove(agencyId, id);
  }
}
