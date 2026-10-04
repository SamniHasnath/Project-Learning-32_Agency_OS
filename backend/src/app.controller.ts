import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './auth/auth-user';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness + database readiness probe for load balancers / container platforms. */
  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', time: new Date().toISOString() };
  }
}
