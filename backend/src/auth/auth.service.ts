import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TEMPLATES } from '../document-templates/default-templates';
import { LoginDto, RegisterDto } from './dto/auth.dto';

// Compared against when the user doesn't exist, so login timing doesn't reveal
// which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Creates a new agency (tenant), its owner and a starter set of templates. */
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const agency = await tx.agency.create({ data: { name: dto.agencyName.trim(), email: dto.email } });
        await tx.documentTemplate.createMany({
          data: DEFAULT_TEMPLATES.map((t) => ({
            ...t,
            agencyId: agency.id,
            branding: t.branding as unknown as Prisma.InputJsonValue,
            layout: t.layout as unknown as Prisma.InputJsonValue,
          })),
        });
        return tx.user.create({
          data: { email: dto.email, name: dto.name.trim(), passwordHash, agencyId: agency.id, role: 'OWNER' },
        });
      });
      return this.session(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');
    return this.session(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { agency: true } });
    return { user: this.publicUser(user), agency: user.agency };
  }

  private async session(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, agencyId: user.agencyId, email: user.email, role: user.role });
    const agency = await this.prisma.agency.findUniqueOrThrow({ where: { id: user.agencyId } });
    return { accessToken, user: this.publicUser(user), agency };
  }

  private publicUser(user: User) {
    return { id: user.id, email: user.email, name: user.name, role: user.role, agencyId: user.agencyId };
  }
}
