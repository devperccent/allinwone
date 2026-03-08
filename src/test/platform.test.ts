import { describe, it, expect } from 'vitest';
import { formatKey, formatShortcut } from '@/lib/platform';

describe('formatKey', () => {
  it('formats Escape', () => {
    expect(formatKey('Escape')).toBe('Esc');
  });

  it('formats arrow keys', () => {
    expect(formatKey('ArrowUp')).toBe('↑');
    expect(formatKey('ArrowDown')).toBe('↓');
    expect(formatKey('ArrowLeft')).toBe('←');
    expect(formatKey('ArrowRight')).toBe('→');
  });

  it('passes through unknown keys', () => {
    expect(formatKey('K')).toBe('K');
    expect(formatKey('Space')).toBe('Space');
  });
});

describe('formatShortcut', () => {
  it('formats array of keys', () => {
    const result = formatShortcut(['Escape', 'K']);
    expect(result).toEqual(['Esc', 'K']);
  });

  it('handles empty array', () => {
    expect(formatShortcut([])).toEqual([]);
  });
});
