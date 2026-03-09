export type InvoiceTemplate = 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant' | 'corporate';

export interface TemplatePalette {
  accent: string;
  accentDark: string;
  accentLight: string;
  accentLighter: string;
  headerBg: string;
  headerText: string;
  tableBg: string;
  tableAltBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  borderRadius: string;
  borderRadiusPdf: number;
  fontStyle: 'modern' | 'serif' | 'clean';
  showThankYou: boolean;
  showAccentBar: boolean;
  tableStyle: 'filled' | 'bordered' | 'minimal';
}

export const TEMPLATE_PALETTES: Record<InvoiceTemplate, TemplatePalette> = {
  modern: {
    accent: '#03556E',
    accentDark: '#024558',
    accentLight: '#E8F4F8',
    accentLighter: '#F5FAFB',
    headerBg: '#ffffff',
    headerText: '#03556E',
    tableBg: '#ffffff',
    tableAltBg: '#F5FAFB',
    tableHeaderBg: '#03556E',
    tableHeaderText: '#ffffff',
    borderRadius: '0.375rem',
    borderRadiusPdf: 4,
    fontStyle: 'modern',
    showThankYou: true,
    showAccentBar: true,
    tableStyle: 'filled',
  },
  classic: {
    accent: '#1e3a5f',
    accentDark: '#152d4a',
    accentLight: '#eef2f7',
    accentLighter: '#f8f9fb',
    headerBg: '#ffffff',
    headerText: '#1e3a5f',
    tableBg: '#ffffff',
    tableAltBg: '#f8f9fb',
    tableHeaderBg: '#1e3a5f',
    tableHeaderText: '#ffffff',
    borderRadius: '0',
    borderRadiusPdf: 0,
    fontStyle: 'serif',
    showThankYou: false,
    showAccentBar: false,
    tableStyle: 'bordered',
  },
  minimal: {
    accent: '#18181b',
    accentDark: '#09090b',
    accentLight: '#f4f4f5',
    accentLighter: '#fafafa',
    headerBg: '#ffffff',
    headerText: '#18181b',
    tableBg: '#ffffff',
    tableAltBg: '#ffffff',
    tableHeaderBg: '#ffffff',
    tableHeaderText: '#18181b',
    borderRadius: '0',
    borderRadiusPdf: 0,
    fontStyle: 'clean',
    showThankYou: false,
    showAccentBar: false,
    tableStyle: 'minimal',
  },
  bold: {
    accent: '#dc2626',
    accentDark: '#b91c1c',
    accentLight: '#fef2f2',
    accentLighter: '#fef9f9',
    headerBg: '#ffffff',
    headerText: '#dc2626',
    tableBg: '#ffffff',
    tableAltBg: '#fef2f2',
    tableHeaderBg: '#dc2626',
    tableHeaderText: '#ffffff',
    borderRadius: '0.5rem',
    borderRadiusPdf: 6,
    fontStyle: 'modern',
    showThankYou: true,
    showAccentBar: true,
    tableStyle: 'filled',
  },
  elegant: {
    accent: '#78716c',
    accentDark: '#57534e',
    accentLight: '#f5f5f4',
    accentLighter: '#fafaf9',
    headerBg: '#ffffff',
    headerText: '#44403c',
    tableBg: '#ffffff',
    tableAltBg: '#fafaf9',
    tableHeaderBg: '#44403c',
    tableHeaderText: '#ffffff',
    borderRadius: '0.125rem',
    borderRadiusPdf: 2,
    fontStyle: 'serif',
    showThankYou: false,
    showAccentBar: false,
    tableStyle: 'bordered',
  },
  corporate: {
    accent: '#0369a1',
    accentDark: '#075985',
    accentLight: '#e0f2fe',
    accentLighter: '#f0f9ff',
    headerBg: '#ffffff',
    headerText: '#0369a1',
    tableBg: '#ffffff',
    tableAltBg: '#f0f9ff',
    tableHeaderBg: '#0369a1',
    tableHeaderText: '#ffffff',
    borderRadius: '0.25rem',
    borderRadiusPdf: 3,
    fontStyle: 'modern',
    showThankYou: true,
    showAccentBar: true,
    tableStyle: 'filled',
  },
};

export const TEMPLATE_META: Record<InvoiceTemplate, { label: string; description: string }> = {
  modern: { label: 'Modern', description: 'Teal accents, rounded corners, alternating rows' },
  classic: { label: 'Classic', description: 'Navy formal style, bordered table, traditional layout' },
  minimal: { label: 'Minimal', description: 'Clean monochrome, thin lines, maximum whitespace' },
};
