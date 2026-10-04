import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** ~375 KB image once base64 encoded. */
const MAX_LOGO_LENGTH = 500_000;

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  taxId?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiPropertyOptional({
    description: 'PNG/JPEG as a base64 data URL, or empty string to remove',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== '')
  @IsString()
  @MaxLength(MAX_LOGO_LENGTH, { message: 'Logo must be smaller than ~375 KB' })
  @Matches(/^data:image\/(png|jpe?g);base64,[A-Za-z0-9+/=]+$/, {
    message: 'Logo must be a PNG or JPEG image',
  })
  logoUrl?: string;
}
