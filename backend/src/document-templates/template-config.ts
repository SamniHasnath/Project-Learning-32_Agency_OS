import type { DocumentType } from '@prisma/client';

export const SECTION_KEYS = [
  'header',
  'parties',
  'items',
  'totals',
  'notes',
  'terms',
  'footer',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const FONT_FAMILIES = ['Helvetica', 'Times-Roman', 'Courier'] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];

export interface TemplateBranding {
  primaryColor: string;
  accentColor: string;
  fontFamily: FontFamily;
  showLogo: boolean;
}

export interface TemplateLayout {
  /** Heading printed on the document, e.g. "QUOTATION" or "TAX INVOICE". */
  title: string;
  /** Render order and visibility of each block. */
  sections: { key: SectionKey; visible: boolean }[];
  footerText?: string;
}

/** What a document stores in `templateSnapshot`. Renderers read only this. */
export interface TemplateSnapshot {
  id: string | null;
  name: string;
  version: number;
  branding: TemplateBranding;
  layout: TemplateLayout;
}

/** Sections that a commercial document can never hide. */
const REQUIRED_SECTIONS: SectionKey[] = ['items', 'totals'];

/**
 * Normalises a layout so renderers can rely on it: every known section appears
 * exactly once (unknown/duplicate keys dropped, missing ones appended) and the
 * required sections are always visible.
 */
export function normaliseLayout(layout: TemplateLayout): TemplateLayout {
  const seen = new Set<SectionKey>();
  const sections: TemplateLayout['sections'] = [];
  for (const s of layout.sections ?? []) {
    if (!SECTION_KEYS.includes(s.key) || seen.has(s.key)) continue;
    seen.add(s.key);
    sections.push({
      key: s.key,
      visible: REQUIRED_SECTIONS.includes(s.key) ? true : !!s.visible,
    });
  }
  for (const key of SECTION_KEYS)
    if (!seen.has(key)) sections.push({ key, visible: true });
  return {
    title: layout.title?.trim() || 'DOCUMENT',
    sections,
    footerText: layout.footerText?.trim() || undefined,
  };
}

const allSections = (hidden: SectionKey[] = []) =>
  SECTION_KEYS.map((key) => ({ key, visible: !hidden.includes(key) }));

export const BUILTIN_TEMPLATE: Record<DocumentType, TemplateSnapshot> = {
  QUOTATION: {
    id: null,
    name: 'Built-in quotation',
    version: 1,
    branding: {
      primaryColor: '#464feb',
      accentColor: '#0f172a',
      fontFamily: 'Helvetica',
      showLogo: true,
    },
    layout: { title: 'QUOTATION', sections: allSections() },
  },
  INVOICE: {
    id: null,
    name: 'Built-in invoice',
    version: 1,
    branding: {
      primaryColor: '#464feb',
      accentColor: '#0f172a',
      fontFamily: 'Helvetica',
      showLogo: true,
    },
    layout: { title: 'INVOICE', sections: allSections() },
  },
};
