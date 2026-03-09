import { cn } from '@/lib/utils';
import type { InvoiceTemplate } from './invoiceTemplates';
import { TEMPLATE_PALETTES, TEMPLATE_META } from './invoiceTemplates';

interface TemplateSelectorProps {
  value: InvoiceTemplate;
  onChange: (template: InvoiceTemplate) => void;
}

const templates: InvoiceTemplate[] = ['modern', 'classic', 'minimal', 'bold', 'elegant', 'corporate'];

function MiniPreview({ template, selected }: { template: InvoiceTemplate; selected: boolean }) {
  const p = TEMPLATE_PALETTES[template];

  return (
    <div
      className={cn(
        'w-full aspect-[3/4] rounded border-2 transition-all overflow-hidden cursor-pointer',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/40'
      )}
      style={{ fontSize: '4px' }}
    >
      {/* Accent bar */}
      {p.showAccentBar && <div className="h-[3px]" style={{ backgroundColor: p.accent }} />}

      {/* Header area */}
      <div className="px-2 pt-1.5 pb-1 flex justify-between items-start">
        <div>
          <div className="h-1 w-8 rounded-sm mb-0.5" style={{ backgroundColor: p.accent, opacity: 0.8 }} />
          <div className="h-0.5 w-6 rounded-sm" style={{ backgroundColor: '#9ca3af' }} />
        </div>
        <div className="text-right">
          <div className="h-1.5 w-7" style={{ backgroundColor: p.headerText, opacity: 0.2 }} />
        </div>
      </div>

      {/* Meta strip */}
      <div className="px-2 py-0.5 flex gap-1" style={{ backgroundColor: p.accentLight }}>
        {[1, 2, 3].map(i => <div key={i} className="h-0.5 flex-1 rounded-sm" style={{ backgroundColor: p.accent, opacity: 0.15 }} />)}
      </div>

      {/* Table header */}
      <div className="mx-2 mt-1">
        <div className="h-1.5 flex gap-0.5 px-0.5" style={{
          backgroundColor: p.tableStyle === 'minimal' ? 'transparent' : p.tableHeaderBg,
          borderBottom: p.tableStyle === 'minimal' ? '0.5px solid #d4d4d8' : 'none',
          borderRadius: p.borderRadiusPdf / 2,
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-0.5 mt-0.5 flex-1 rounded-sm" style={{
              backgroundColor: p.tableStyle === 'minimal' ? '#a1a1aa' : p.tableHeaderText,
              opacity: 0.4,
            }} />
          ))}
        </div>
        {/* Table rows */}
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1.5 flex gap-0.5 px-0.5" style={{
            backgroundColor: i % 2 === 1 ? p.tableAltBg : p.tableBg,
            borderBottom: p.tableStyle !== 'filled' ? '0.5px solid #e5e7eb' : 'none',
          }}>
            {[1, 2, 3].map(j => (
              <div key={j} className="h-0.5 mt-0.5 flex-1 rounded-sm" style={{ backgroundColor: '#9ca3af', opacity: 0.25 }} />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      {p.showThankYou && (
        <div className="mx-2 mt-1 h-1.5 rounded-sm" style={{ backgroundColor: p.accent, opacity: 0.7 }} />
      )}
    </div>
  );
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Template Style</label>
      <div className="grid grid-cols-3 gap-2">
        {templates.map(t => (
          <button key={t} type="button" onClick={() => onChange(t)} className="text-center space-y-1">
            <MiniPreview template={t} selected={value === t} />
            <span className={cn(
              'text-[10px] font-medium block',
              value === t ? 'text-primary' : 'text-muted-foreground'
            )}>
              {TEMPLATE_META[t].label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
