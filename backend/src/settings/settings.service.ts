import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.agencySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.agencySettings.create({
        data: {
          id: 'default',
          name: 'Agency OS',
          email: 'billing@agencyos.com',
          phone: '+1 (555) 019-2831',
          website: 'https://agencyos.io',
          currency: 'USD',
          address: '742 Evergreen Terrace, Suite 400, San Francisco, CA',
        },
      });
    }

    return settings;
  }

  async updateSettings(data: any) {
    return this.prisma.agencySettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
  }
}
