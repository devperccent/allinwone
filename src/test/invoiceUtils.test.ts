import { describe, it, expect } from 'vitest';
import { computeItemAmount, generateId, createEmptyItem } from '@/utils/invoiceUtils';

describe('computeItemAmount', () => {
  it('computes basic amount with tax', () => {
    const result = computeItemAmount({ qty: 2, rate: 100, discount: 0, tax_rate: 18 });
    expect(result).toBeCloseTo(236); // (2*100 - 0) * 1.18
  });

  it('applies discount before tax', () => {
    const result = computeItemAmount({ qty: 1, rate: 1000, discount: 200, tax_rate: 18 });
    expect(result).toBeCloseTo(944); // (1000 - 200) * 1.18
  });

  it('handles zero tax', () => {
    const result = computeItemAmount({ qty: 3, rate: 50, discount: 0, tax_rate: 0 });
    expect(result).toBe(150);
  });

  it('handles zero qty', () => {
    const result = computeItemAmount({ qty: 0, rate: 100, discount: 0, tax_rate: 18 });
    expect(result).toBe(0);
  });

  it('handles zero rate', () => {
    const result = computeItemAmount({ qty: 5, rate: 0, discount: 0, tax_rate: 18 });
    expect(result).toBe(0);
  });

  it('handles high discount (negative taxable)', () => {
    const result = computeItemAmount({ qty: 1, rate: 100, discount: 200, tax_rate: 18 });
    expect(result).toBeCloseTo(-118); // (100 - 200) * 1.18
  });

  it('handles 28% GST rate', () => {
    const result = computeItemAmount({ qty: 1, rate: 1000, discount: 0, tax_rate: 28 });
    expect(result).toBeCloseTo(1280);
  });

  it('handles 5% GST rate', () => {
    const result = computeItemAmount({ qty: 10, rate: 100, discount: 50, tax_rate: 5 });
    expect(result).toBeCloseTo(997.5); // (1000 - 50) * 1.05
  });
});

describe('generateId', () => {
  it('returns a UUID-like string', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('createEmptyItem', () => {
  it('creates an item with defaults', () => {
    const item = createEmptyItem();
    expect(item.id).toBeTruthy();
    expect(item.product_id).toBeNull();
    expect(item.description).toBe('');
    expect(item.qty).toBe(1);
    expect(item.rate).toBe(0);
    expect(item.tax_rate).toBe(18);
    expect(item.discount).toBe(0);
  });

  it('creates unique items', () => {
    const a = createEmptyItem();
    const b = createEmptyItem();
    expect(a.id).not.toBe(b.id);
  });
});
