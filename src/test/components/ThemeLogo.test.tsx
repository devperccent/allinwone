import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeLogo } from '@/components/ThemeLogo';

describe('ThemeLogo', () => {
  it('renders two images for light/dark', () => {
    render(<ThemeLogo />);
    const images = screen.getAllByAltText('Inw');
    expect(images).toHaveLength(2);
  });

  it('accepts custom className', () => {
    render(<ThemeLogo className="h-8 w-auto" />);
    const images = screen.getAllByAltText('Inw');
    images.forEach(img => {
      expect(img.className).toContain('h-8');
    });
  });
});
