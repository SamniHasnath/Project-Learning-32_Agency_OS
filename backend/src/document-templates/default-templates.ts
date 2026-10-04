import type { DocumentType } from '@prisma/client';
import {
  SECTION_KEYS,
  type SectionKey,
  type TemplateBranding,
  type TemplateLayout,
} from './template-config';

const sections = (
  order: SectionKey[] = [...SECTION_KEYS],
  hidden: SectionKey[] = [],
) => order.map((key) => ({ key, visible: !hidden.includes(key) }));

interface TemplateSeed {
  name: string;
  type: DocumentType;
  isDefault: boolean;
  branding: TemplateBranding;
  layout: TemplateLayout;
}

/** Starter templates every new agency receives; fully editable afterwards. */
export const DEFAULT_TEMPLATES: TemplateSeed[] = [
  {
    name: 'Classic quotation',
    type: 'QUOTATION',
    isDefault: true,
    branding: {
      primaryColor: '#464feb',
      accentColor: '#0f172a',
      fontFamily: 'Helvetica',
      showLogo: true,
    },
    layout: {
      title: 'QUOTATION',
      sections: sections(),
      footerText:
        'Thank you for the opportunity. This quotation is valid until the expiry date shown above.',
    },
  },
  {
    name: 'Minimal proposal',
    type: 'QUOTATION',
    isDefault: false,
    branding: {
      primaryColor: '#0f172a',
      accentColor: '#64748b',
      fontFamily: 'Times-Roman',
      showLogo: false,
    },
    layout: {
      title: 'PROPOSAL',
      sections: sections([
        'header',
        'parties',
        'notes',
        'items',
        'totals',
        'terms',
        'footer',
      ]),
    },
  },
  {
    name: 'Classic invoice',
    type: 'INVOICE',
    isDefault: true,
    branding: {
      primaryColor: '#464feb',
      accentColor: '#0f172a',
      fontFamily: 'Helvetica',
      showLogo: true,
    },
    layout: {
      title: 'INVOICE',
      sections: sections(),
      footerText: 'Thank you for your business.',
    },
  },
  {
    name: 'Bold tax invoice',
    type: 'INVOICE',
    isDefault: false,
    branding: {
      primaryColor: '#0e7490',
      accentColor: '#164e63',
      fontFamily: 'Helvetica',
      showLogo: true,
    },
    layout: {
      title: 'TAX INVOICE',
      sections: sections(undefined, ['notes']),
      footerText: 'Please quote the invoice number with your payment.',
    },
  },
];
