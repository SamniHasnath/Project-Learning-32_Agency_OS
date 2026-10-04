import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FONT_FAMILIES, SECTION_KEYS, type FontFamily, type SectionKey } from '../template-config';

export class BrandingDto {
  @ApiProperty({ example: '#464feb' })
  @IsHexColor()
  primaryColor: string;

  @ApiProperty({ example: '#0f172a' })
  @IsHexColor()
  accentColor: string;

  @ApiProperty({ enum: FONT_FAMILIES })
  @IsIn(FONT_FAMILIES)
  fontFamily: FontFamily;

  @ApiProperty()
  @IsBoolean()
  showLogo: boolean;
}

export class SectionDto {
  @ApiProperty({ enum: SECTION_KEYS })
  @IsIn(SECTION_KEYS)
  key: SectionKey;

  @ApiProperty()
  @IsBoolean()
  visible: boolean;
}

export class LayoutDto {
  @ApiProperty({ example: 'QUOTATION' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  title: string;

  @ApiProperty({ type: [SectionDto] })
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  @ArrayMaxSize(SECTION_KEYS.length)
  sections: SectionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  footerText?: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ type: BrandingDto })
  @ValidateNested()
  @Type(() => BrandingDto)
  branding: BrandingDto;

  @ApiProperty({ type: LayoutDto })
  @ValidateNested()
  @Type(() => LayoutDto)
  layout: LayoutDto;
}

/** `type` is fixed after creation — a quotation template can't become an invoice template. */
export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
