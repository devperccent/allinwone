import inwWideLogo from '@/assets/inw-wide.png';
import inwWideWhiteLogo from '@/assets/inw-wide-white.png';

interface ThemeLogoProps {
  className?: string;
}

export function ThemeLogo({ className = 'h-12 object-contain' }: ThemeLogoProps) {
  return (
    <>
      <img src={inwWideLogo} alt="Inw" className={`dark:hidden ${className}`} />
      <img src={inwWideWhiteLogo} alt="Inw" className={`hidden dark:block ${className}`} />
    </>
  );
}
