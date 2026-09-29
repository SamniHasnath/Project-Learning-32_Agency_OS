import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private memorySettings = {
    id: 'default',
    name: 'Northstar Creative',
    email: 'hello@northstarcreative.com',
    phone: '+1 (415) 555-0184',
    website: 'northstarcreative.com',
    taxId: 'US948301928',
    currency: 'USD',
    address: '742 Evergreen Terrace, Suite 400, San Francisco, CA 94107',
  };

  constructor(private prisma: PrismaService) {}

  async getSettings() {
    if (this.prisma.isConnected) {
      try {
        let settings = await this.prisma.agencySettings.findUnique({
          where: { id: 'default' },
        });

        if (!settings) {
          settings = await this.prisma.agencySettings.create({
            data: this.memorySettings,
          });
        }

        return settings;
      } catch (e) {
        console.warn('DB error in Settings, using memory fallback:', e?.message);
      }
    }

    return this.memorySettings;
  }

  async updateSettings(data: any) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.agencySettings.upsert({
          where: { id: 'default' },
          update: data,
          create: { id: 'default', ...data },
        });
      } catch (e) {
        console.warn('DB error updating Settings, using memory fallback:', e?.message);
      }
    }

    this.memorySettings = { ...this.memorySettings, ...data };
    return this.memorySettings;
  }
}
