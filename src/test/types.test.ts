import { describe, it, expect } from 'vitest';
import { INDIAN_STATES, GST_RATES } from '@/types';

describe('INDIAN_STATES', () => {
  it('has Maharashtra at 27', () => {
    expect(INDIAN_STATES['27']).toBe('Maharashtra');
  });

  it('has Delhi at 07', () => {
    expect(INDIAN_STATES['07']).toBe('Delhi');
  });

  it('has at least 30 states', () => {
    expect(Object.keys(INDIAN_STATES).length).toBeGreaterThanOrEqual(30);
  });

  it('all values are non-empty strings', () => {
    Object.values(INDIAN_STATES).forEach(name => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });
});

describe('GST_RATES', () => {
  it('has standard rates', () => {
    expect(GST_RATES).toContain(0);
    expect(GST_RATES).toContain(5);
    expect(GST_RATES).toContain(12);
    expect(GST_RATES).toContain(18);
    expect(GST_RATES).toContain(28);
  });

  it('has exactly 5 rates', () => {
    expect(GST_RATES).toHaveLength(5);
  });

  it('is sorted ascending', () => {
    for (let i = 1; i < GST_RATES.length; i++) {
      expect(GST_RATES[i]).toBeGreaterThan(GST_RATES[i - 1]);
    }
  });
});
