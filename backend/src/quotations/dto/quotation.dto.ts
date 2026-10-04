import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { QuotationStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DocumentPricingDto } from '../../common/documents/document.dto';

export class CreateQuotationDto extends DocumentPricingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Defaults to the agency default quotation template' })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @ApiProperty({ example: 'Website redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: '2026-10-04' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ example: '2026-11-03' })
  @IsDateString()
  expiryDate: string;
}

/** Only DRAFT quotations can be edited; any field may be supplied. */
export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {}

export class UpdateQuotationStatusDto {
  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;
}

export class ConvertQuotationDto {
  @ApiPropertyOptional({ example: '2026-10-18', description: 'Defaults to 14 days from today' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Invoice template; defaults to the agency default' })
  @IsOptional()
  @IsUUID()
  templateId?: string;
}

export class ListQuotationsQuery {
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
