import { Injectable } from '@nestjs/common';
import { Invoice, InvoiceItem, Prisma, Quotation, QuotationItem } from '@prisma/client';
import PDFDocument from 'pdfkit';
import type { AgencySnapshot, ClientSnapshot } from '../common/documents/snapshot.service';
import { BUILTIN_TEMPLATE, normaliseLayout, type SectionKey, type TemplateSnapshot } from '../document-templates/template-config';

type Decimal = Prisma.Decimal;
type Item = Pick<QuotationItem | InvoiceItem, 'description' | 'quantity' | 'unitPrice' | 'lineTotal'>;

/** Renderer-agnostic view of a quotation or invoice, built purely from stored snapshots. */
interface DocumentView {
  kind: 'QUOTATION' | 'INVOICE';
  number: string;
  title: string;
  status: string;
  currency: string;
  meta: [string, string][];
  client: ClientSnapshot;
  agency: AgencySnapshot;
  template: TemplateSnapshot;
  items: Item[];
  totals: { label: string; value: string; strong?: boolean }[];
  notes: string | null;
  terms: string | null;
}

const PAGE = { width: 595.28, height: 841.89, margin: 50 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const BOTTOM_LIMIT = PAGE.height - 90;
const MUTED = '#64748b';
const TEXT = '#0f172a';
const RULE = '#e2e8f0';

const BOLD_FONT: Record<string, string> = { Helvetica: 'Helvetica-Bold', 'Times-Roman': 'Times-Bold', Courier: 'Courier-Bold' };

/**
 * Generates real, text-based A4 PDFs (selectable text, vector graphics — not
 * screenshots) for quotations and invoices. Layout, section order/visibility,
 * colours and fonts all come from the document's `templateSnapshot`, so one
 * renderer serves every template and historical documents render exactly as
 * they were issued.
 */
@Injectable()
export class PdfService {
  renderQuotation(q: Quotation & { items: Item[] }) {
    const money = moneyFormatter(q.currency);
    return this.render({
      kind: 'QUOTATION',
      number: q.number,
      title: q.title,
      status: q.status,
      currency: q.currency,
      meta: [
        ['Quotation no.', q.number],
        ['Issue date', formatDate(q.issueDate)],
        ['Valid until', formatDate(q.expiryDate)],
      ],
      client: q.clientSnapshot as unknown as ClientSnapshot,
      agency: q.agencySnapshot as unknown as AgencySnapshot,
      template: asTemplate(q.templateSnapshot, 'QUOTATION'),
      items: q.items,
      totals: baseTotals(q, money),
      notes: q.notes,
      terms: q.terms,
    });
  }

  renderInvoice(inv: Invoice & { items: Item[] }) {
    const money = moneyFormatter(inv.currency);
    const meta: [string, string][] = [
      ['Invoice no.', inv.number],
      ['Issue date', formatDate(inv.issueDate)],
      ['Due date', formatDate(inv.dueDate)],
    ];
    if (inv.reference) meta.push(['Reference', inv.reference]);
    return this.render({
      kind: 'INVOICE',
      number: inv.number,
      title: inv.title,
      status: inv.status,
      currency: inv.currency,
      meta,
      client: inv.clientSnapshot as unknown as ClientSnapshot,
      agency: inv.agencySnapshot as unknown as AgencySnapshot,
      template: asTemplate(inv.templateSnapshot, 'INVOICE'),
      items: inv.items,
      totals: [
        ...baseTotals(inv, money),
        { label: 'Amount paid', value: money(inv.paidAmount) },
        { label: 'Balance due', value: money(inv.outstandingAmount), strong: true },
      ],
      notes: inv.notes,
      terms: inv.terms,
    });
  }

  private render(view: DocumentView): Promise<Buffer> {
    const { branding, layout } = view.template;
    const font = BOLD_FONT[branding.fontFamily] ? branding.fontFamily : 'Helvetica';
    const bold = BOLD_FONT[font];
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
      bufferPages: true,
      info: { Title: `${layout.title} ${view.number}`, Author: view.agency.name, Subject: view.title },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const ctx = { doc, view, font, bold, primary: branding.primaryColor, accent: branding.accentColor };
    const renderers: Record<SectionKey, () => void> = {
      header: () => this.header(ctx),
      parties: () => this.parties(ctx),
      items: () => this.items(ctx),
      totals: () => this.totals(ctx),
      notes: () => this.textBlock(ctx, 'Notes', view.notes),
      terms: () => this.textBlock(ctx, 'Terms & conditions', view.terms),
      footer: () => undefined, // drawn on the last page below, after layout is known
    };
    for (const section of layout.sections) if (section.visible) renderers[section.key]();

    const showFooter = layout.sections.some((s) => s.key === 'footer' && s.visible);
    this.decoratePages(ctx, showFooter ? layout.footerText : undefined);
    doc.end();
    return done;
  }

  private header({ doc, view, font, bold, primary }: Ctx) {
    const top = doc.y;
    let leftY = top;
    const logo = view.template.branding.showLogo ? decodeImage(view.agency.logoUrl) : null;
    if (logo) {
      try {
        doc.image(logo, PAGE.margin, top, { fit: [140, 48] });
        leftY += 56;
      } catch {
        // Unreadable image data: render without the logo rather than failing the document.
      }
    }
    doc.font(bold).fontSize(13).fillColor(TEXT).text(view.agency.name, PAGE.margin, leftY, { width: 260 });
    const contact = [view.agency.address, view.agency.email, view.agency.phone, view.agency.website, view.agency.taxId && `Tax ID: ${view.agency.taxId}`]
      .filter(Boolean)
      .join('\n');
    if (contact) doc.font(font).fontSize(8.5).fillColor(MUTED).text(contact, { width: 260, lineGap: 1.5 });
    const leftBottom = doc.y;

    const rightX = PAGE.margin + 270;
    const rightWidth = CONTENT_WIDTH - 270;
    doc.font(bold).fontSize(22).fillColor(primary).text(view.template.layout.title, rightX, top, { width: rightWidth, align: 'right' });
    doc.font(font).fontSize(10).fillColor(TEXT).text(view.number, { width: rightWidth, align: 'right' });
    doc.font(bold).fontSize(8).fillColor(MUTED).text(view.status.replace('_', ' '), { width: rightWidth, align: 'right', characterSpacing: 0.8 });
    const rightBottom = doc.y;

    const y = Math.max(leftBottom, rightBottom) + 16;
    doc.moveTo(PAGE.margin, y).lineTo(PAGE.width - PAGE.margin, y).lineWidth(1.5).strokeColor(primary).stroke();
    doc.x = PAGE.margin;
    doc.y = y + 18;
  }

  private parties({ doc, view, font, bold, accent }: Ctx) {
    const top = doc.y;
    const c = view.client;
    doc.font(bold).fontSize(8).fillColor(accent).text('BILL TO', PAGE.margin, top, { characterSpacing: 0.8 });
    doc.moveDown(0.3).font(bold).fontSize(11).fillColor(TEXT).text(c.company || c.name, { width: 250 });
    const lines = [c.company ? c.name : null, c.email, c.phone, c.address, c.taxId && `Tax ID: ${c.taxId}`].filter(Boolean).join('\n');
    if (lines) doc.font(font).fontSize(9).fillColor(MUTED).text(lines, { width: 250, lineGap: 1.5 });
    const leftBottom = doc.y;

    const labelX = PAGE.margin + 290;
    let y = top;
    for (const [label, value] of view.meta) {
      doc.font(font).fontSize(9).fillColor(MUTED).text(label, labelX, y, { width: 90 });
      doc.font(bold).fontSize(9).fillColor(TEXT).text(value, labelX + 90, y, { width: CONTENT_WIDTH - 380, align: 'right' });
      y += 16;
    }
    doc.x = PAGE.margin;
    doc.y = Math.max(leftBottom, y) + 22;
  }

  private items(ctx: Ctx) {
    const { doc, view, font, bold } = ctx;
    const money = moneyFormatter(view.currency);
    doc.font(bold).fontSize(12).fillColor(TEXT).text(view.title, PAGE.margin, doc.y, { width: CONTENT_WIDTH });
    doc.moveDown(0.6);

    const cols = { index: 50, desc: 72, qty: 330, unit: 385, amount: 465 };
    const widths = { index: 20, desc: 252, qty: 50, unit: 75, amount: 80 };
    const drawHeader = () => {
      const y = doc.y;
      doc.rect(PAGE.margin, y, CONTENT_WIDTH, 22).fill(ctx.primary);
      doc.font(bold).fontSize(8.5).fillColor('#ffffff');
      doc.text('#', cols.index + 4, y + 7, { width: widths.index });
      doc.text('DESCRIPTION', cols.desc, y + 7, { width: widths.desc });
      doc.text('QTY', cols.qty, y + 7, { width: widths.qty, align: 'right' });
      doc.text('UNIT PRICE', cols.unit, y + 7, { width: widths.unit, align: 'right' });
      doc.text('AMOUNT', cols.amount, y + 7, { width: widths.amount - 6, align: 'right' });
      doc.y = y + 22;
    };
    drawHeader();

    view.items.forEach((item, i) => {
      doc.font(font).fontSize(9);
      const rowHeight = Math.max(doc.heightOfString(item.description, { width: widths.desc }), 11) + 12;
      if (doc.y + rowHeight > BOTTOM_LIMIT) {
        doc.addPage();
        drawHeader();
      }
      const y = doc.y;
      if (i % 2 === 1) doc.rect(PAGE.margin, y, CONTENT_WIDTH, rowHeight).fill('#f8fafc');
      doc.font(font).fontSize(9).fillColor(MUTED).text(String(i + 1), cols.index + 4, y + 6, { width: widths.index });
      doc.fillColor(TEXT).text(item.description, cols.desc, y + 6, { width: widths.desc });
      doc.text(formatQuantity(item.quantity), cols.qty, y + 6, { width: widths.qty, align: 'right' });
      doc.text(money(item.unitPrice), cols.unit, y + 6, { width: widths.unit, align: 'right' });
      doc.font(bold).text(money(item.lineTotal), cols.amount, y + 6, { width: widths.amount - 6, align: 'right' });
      doc.moveTo(PAGE.margin, y + rowHeight).lineTo(PAGE.width - PAGE.margin, y + rowHeight).lineWidth(0.5).strokeColor(RULE).stroke();
      doc.y = y + rowHeight;
    });
    doc.x = PAGE.margin;
    doc.moveDown(1);
  }

  private totals({ doc, view, font, bold, primary }: Ctx) {
    const needed = view.totals.length * 18 + 20;
    if (doc.y + needed > BOTTOM_LIMIT) doc.addPage();
    const x = PAGE.margin + 280;
    const width = CONTENT_WIDTH - 280;
    let y = doc.y;
    for (const row of view.totals) {
      if (row.label === 'Total') {
        doc.moveTo(x, y - 3).lineTo(x + width, y - 3).lineWidth(0.8).strokeColor(RULE).stroke();
        y += 4;
      }
      const size = row.strong ? 11.5 : 9.5;
      doc.font(row.strong ? bold : font).fontSize(size).fillColor(row.strong ? primary : MUTED).text(row.label, x, y, { width: width / 2 });
      doc.font(row.strong ? bold : font).fontSize(size).fillColor(row.strong ? primary : TEXT).text(row.value, x + width / 2, y, { width: width / 2, align: 'right' });
      y += row.strong ? 20 : 17;
    }
    doc.x = PAGE.margin;
    doc.y = y + 14;
  }

  private textBlock({ doc, font, bold, accent }: Ctx, heading: string, body: string | null) {
    if (!body?.trim()) return;
    if (doc.y + 50 > BOTTOM_LIMIT) doc.addPage();
    doc.font(bold).fontSize(8).fillColor(accent).text(heading.toUpperCase(), PAGE.margin, doc.y, { characterSpacing: 0.8 });
    doc.moveDown(0.3).font(font).fontSize(9).fillColor(TEXT).text(body.trim(), { width: CONTENT_WIDTH, lineGap: 2 });
    doc.moveDown(1.2);
  }

  /** Page numbers on every page, footer text on the last, DRAFT/VOID watermark. */
  private decoratePages({ doc, view, font, primary }: Ctx, footerText?: string) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0; // allow writing in the bottom margin without triggering a new page

      if (view.status === 'DRAFT' || view.status === 'VOID') {
        doc.save();
        doc.rotate(-35, { origin: [PAGE.width / 2, PAGE.height / 2] });
        doc.font('Helvetica-Bold').fontSize(110).fillColor(view.status === 'VOID' ? '#dc2626' : '#94a3b8').fillOpacity(0.08);
        doc.text(view.status, 0, PAGE.height / 2 - 55, { width: PAGE.width, align: 'center', lineBreak: false });
        doc.restore();
        doc.fillOpacity(1);
      }

      const isLast = i === range.start + range.count - 1;
      if (isLast && footerText) {
        doc.font(font).fontSize(8.5).fillColor(MUTED).text(footerText, PAGE.margin, PAGE.height - 70, { width: CONTENT_WIDTH, align: 'center' });
      }
      doc.moveTo(PAGE.margin, PAGE.height - 45).lineTo(PAGE.width - PAGE.margin, PAGE.height - 45).lineWidth(0.5).strokeColor(primary).stroke();
      doc.font(font).fontSize(7.5).fillColor(MUTED);
      doc.text(`${view.agency.name} · ${view.number}`, PAGE.margin, PAGE.height - 38, { width: CONTENT_WIDTH / 2, lineBreak: false });
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, PAGE.margin + CONTENT_WIDTH / 2, PAGE.height - 38, {
        width: CONTENT_WIDTH / 2,
        align: 'right',
        lineBreak: false,
      });
    }
  }
}

type Ctx = { doc: PDFKit.PDFDocument; view: DocumentView; font: string; bold: string; primary: string; accent: string };

function asTemplate(snapshot: Prisma.JsonValue, kind: 'QUOTATION' | 'INVOICE'): TemplateSnapshot {
  const t = (snapshot ?? {}) as unknown as Partial<TemplateSnapshot>;
  const fallback = BUILTIN_TEMPLATE[kind];
  return {
    ...fallback,
    ...t,
    branding: { ...fallback.branding, ...(t.branding ?? {}) },
    layout: normaliseLayout(t.layout ?? fallback.layout),
  };
}

function baseTotals(
  d: { subtotal: Decimal; discountAmount: Decimal; discountType: string; discountValue: Decimal; taxRate: Decimal; taxAmount: Decimal; total: Decimal },
  money: (v: Decimal) => string,
) {
  const rows: DocumentView['totals'] = [{ label: 'Subtotal', value: money(d.subtotal) }];
  if (d.discountAmount.gt(0)) {
    const label = d.discountType === 'PERCENTAGE' ? `Discount (${d.discountValue.toString()}%)` : 'Discount';
    rows.push({ label, value: `-${money(d.discountAmount)}` });
  }
  rows.push({ label: `Tax (${d.taxRate.toString()}%)`, value: money(d.taxAmount) });
  rows.push({ label: 'Total', value: money(d.total), strong: true });
  return rows;
}

/** Currency formatter; falls back to the ISO code when the symbol isn't in the PDF's WinAnsi font set. */
function moneyFormatter(currency: string) {
  let symbolFmt: Intl.NumberFormat;
  let codeFmt: Intl.NumberFormat;
  try {
    symbolFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
    codeFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2 });
  } catch {
    symbolFmt = codeFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  }
  return (value: Decimal | number) => {
    const n = Number(value.toString());
    const text = symbolFmt.format(n);
    // eslint-disable-next-line no-control-regex
    return /[^\x00-\xff]/.test(text) ? codeFmt.format(n).replace(/ /g, ' ') : text;
  };
}

function formatQuantity(q: Decimal) {
  return q.toDecimalPlaces(3).toString();
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Logos are stored as base64 data URLs (no remote fetching → no SSRF). */
function decodeImage(dataUrl: string | null | undefined) {
  const match = dataUrl?.match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/);
  return match ? Buffer.from(match[2], 'base64') : null;
}
