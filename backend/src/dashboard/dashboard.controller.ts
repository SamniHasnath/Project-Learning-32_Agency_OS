import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAgency } from '../auth/auth-user';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metrics')
  getMetrics(@CurrentAgency() agencyId: string) {
    return this.dashboard.getMetrics(agencyId);
  }

  @Get('recent')
  getRecentActivity(@CurrentAgency() agencyId: string) {
    return this.dashboard.getRecentActivity(agencyId);
  }

  @Get('documents')
  getDocumentOverview(@CurrentAgency() agencyId: string) {
    return this.dashboard.getDocumentOverview(agencyId);
  }
}
