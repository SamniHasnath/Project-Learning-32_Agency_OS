import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

/** The agency profile — branding and company details printed on new documents. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getSettings(agencyId: string) {
    return this.prisma.agency.findUniqueOrThrow({ where: { id: agencyId } });
  }

  updateSettings(agencyId: string, dto: UpdateSettingsDto) {
    const data = Object.fromEntries(
      Object.entries(dto).map(([k, v]) => [
        k,
        typeof v === 'string' && k !== 'name' && k !== 'email'
          ? v.trim() || null
          : v,
      ]),
    );
    // Existing documents keep their agencySnapshot; only documents created from now on pick these up.
    return this.prisma.agency.update({ where: { id: agencyId }, data });
  }
}
