import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DocumentPricingDto } from '../../common/documents/document.dto';

export class CreateInvoiceDto extends DocumentPricingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Defaults to the agency default invoice template' })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @ApiProperty({ example: 'Website redesign — milestone 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'PO-7781' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ example: '2026-10-04' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-10-18', description: 'Defaults to 14 days after the issue date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

/** Only DRAFT invoices can be edited. */
export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatus, description: 'PARTIALLY_PAID and PAID are set by recording payments' })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}

export class ListInvoicesQuery {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
