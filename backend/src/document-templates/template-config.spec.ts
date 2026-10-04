import { normaliseLayout, SECTION_KEYS } from './template-config';

describe('normaliseLayout', () => {
  it('keeps the given order and appends missing sections', () => {
    const layout = normaliseLayout({
      title: 'QUOTE',
      sections: [
        { key: 'notes', visible: true },
        { key: 'header', visible: true },
      ],
    });
    expect(layout.sections.map((s) => s.key).slice(0, 2)).toEqual([
      'notes',
      'header',
    ]);
    expect(layout.sections).toHaveLength(SECTION_KEYS.length);
  });

  it('drops duplicates and unknown keys', () => {
    const layout = normaliseLayout({
      title: 'X',
      sections: [
        { key: 'header', visible: true },
        { key: 'header', visible: false },
        { key: 'bogus' as never, visible: true },
      ],
    });
    expect(layout.sections.filter((s) => s.key === 'header')).toEqual([
      { key: 'header', visible: true },
    ]);
    expect(layout.sections.some((s) => (s.key as string) === 'bogus')).toBe(
      false,
    );
  });

  it('never hides line items or totals', () => {
    const layout = normaliseLayout({
      title: 'X',
      sections: [
        { key: 'items', visible: false },
        { key: 'totals', visible: false },
        { key: 'notes', visible: false },
      ],
    });
    expect(layout.sections.find((s) => s.key === 'items')?.visible).toBe(true);
    expect(layout.sections.find((s) => s.key === 'totals')?.visible).toBe(true);
    expect(layout.sections.find((s) => s.key === 'notes')?.visible).toBe(false);
  });
});
