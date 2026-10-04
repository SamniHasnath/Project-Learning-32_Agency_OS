import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';

/** Identity attached to every authenticated request by JwtAuthGuard. */
export interface AuthUser {
  userId: string;
  agencyId: string;
  email: string;
  role: UserRole;
}

export const IS_PUBLIC_KEY = 'isPublic';
/** Opt a route out of the global JWT guard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** The authenticated user. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);

/**
 * The caller's agency id — always taken from the verified JWT, never from the
 * request body, query or params. This is the tenant boundary for every query.
 */
export const CurrentAgency = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user.agencyId,
);
