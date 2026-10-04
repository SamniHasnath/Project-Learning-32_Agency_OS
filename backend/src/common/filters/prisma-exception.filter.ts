import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/** Maps Prisma's known request errors to proper HTTP responses instead of 500s. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const map: Record<string, [HttpStatus, string]> = {
      P2002: [HttpStatus.CONFLICT, 'A record with these values already exists'],
      P2003: [
        HttpStatus.CONFLICT,
        'This record is referenced by other records',
      ],
      P2025: [HttpStatus.NOT_FOUND, 'Record not found'],
    };
    const [status, message] = map[exception.code] ?? [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Database error',
    ];
    if (status === HttpStatus.INTERNAL_SERVER_ERROR)
      this.logger.error(exception.message);
    response
      .status(status)
      .json({ statusCode: status, message, error: exception.code });
  }
}
