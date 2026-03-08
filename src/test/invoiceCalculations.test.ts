import { describe, it, expect } from 'vitest';
import { formatINR, numberToWords } from '@/hooks/useInvoiceCalculations';

describe('formatINR', () => {
  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('formats positive amounts with Indian locale', () => {
    const result = formatINR(1234567.89);
    expect(result).toContain('12');
    expect(result).toContain('67.89');
  });

  it('formats negative amounts', () => {
    const result = formatINR(-500);
    expect(result).toContain('500.00');
  });

  it('formats small amounts', () => {
    expect(formatINR(0.5)).toBe('₹0.50');
  });

  it('formats large amounts', () => {
    const result = formatINR(10000000);
    expect(result).toContain('1,00,00,000.00');
  });
});

describe('numberToWords', () => {
  it('converts zero', () => {
    expect(numberToWords(0)).toBe('Zero');
  });

  it('converts single digits', () => {
    expect(numberToWords(5)).toBe('Five Only');
  });

  it('converts teens', () => {
    expect(numberToWords(15)).toBe('Fifteen Only');
  });

  it('converts tens', () => {
    expect(numberToWords(42)).toBe('Forty Two Only');
  });

  it('converts hundreds', () => {
    expect(numberToWords(100)).toBe('One Hundred Only');
    expect(numberToWords(523)).toBe('Five Hundred Twenty Three Only');
  });

  it('converts thousands (Indian system)', () => {
    expect(numberToWords(1000)).toBe('One Thousand Only');
    expect(numberToWords(50000)).toBe('Fifty Thousand Only');
  });

  it('converts lakhs', () => {
    expect(numberToWords(100000)).toBe('One Lakh Only');
    expect(numberToWords(250000)).toBe('Two Lakh Fifty Thousand Only');
  });

  it('converts crores', () => {
    expect(numberToWords(10000000)).toBe('One Crore Only');
  });

  it('handles paise', () => {
    const result = numberToWords(100.50);
    expect(result).toContain('One Hundred');
    expect(result).toContain('Fifty Paise');
    expect(result).toContain('Only');
  });
});
