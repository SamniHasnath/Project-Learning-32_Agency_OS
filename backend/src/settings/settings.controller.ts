import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAgency } from '../auth/auth-user';
import { UpdateSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getSettings(@CurrentAgency() agencyId: string) {
    return this.settings.getSettings(agencyId);
  }

  @Patch()
  updateSettings(
    @CurrentAgency() agencyId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settings.updateSettings(agencyId, dto);
  }
}
