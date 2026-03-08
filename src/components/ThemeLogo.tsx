import { forwardRef } from 'react';
import inwWideLogo from '@/assets/inw-wide.png';
import inwWideWhiteLogo from '@/assets/inw-wide-white.png';

interface ThemeLogoProps {
  className?: string;
}

export const ThemeLogo = forwardRef<HTMLDivElement, ThemeLogoProps>(
  ({ className = 'h-12 object-contain' }, ref) => {
    return (
      <div ref={ref} className="inline-flex">
        <img src={inwWideLogo} alt="Inw" className={`dark:hidden ${className}`} />
        <img src={inwWideWhiteLogo} alt="Inw" className={`hidden dark:block ${className}`} />
      </div>
    );
  }
);

ThemeLogo.displayName = 'ThemeLogo';
