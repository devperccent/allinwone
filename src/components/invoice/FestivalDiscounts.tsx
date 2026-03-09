import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface FestivalDiscount {
  name: string;
  emoji: string;
  discount: number;
  months: number[]; // 0-indexed months when relevant
}

const FESTIVAL_DISCOUNTS: FestivalDiscount[] = [
  { name: 'Diwali Sale', emoji: '🪔', discount: 15, months: [9, 10] },
  { name: 'Holi Offer', emoji: '🎨', discount: 10, months: [2, 3] },
  { name: 'Navratri Special', emoji: '🙏', discount: 12, months: [9] },
  { name: 'Pongal/Makar Sankranti', emoji: '🌾', discount: 8, months: [0] },
  { name: 'Raksha Bandhan', emoji: '🎀', discount: 10, months: [7, 8] },
  { name: 'Eid Offer', emoji: '🌙', discount: 10, months: [] },
  { name: 'Christmas/New Year', emoji: '🎄', discount: 12, months: [11, 0] },
  { name: 'Independence Day', emoji: '🇮🇳', discount: 15, months: [7] },
  { name: 'Republic Day', emoji: '🇮🇳', discount: 10, months: [0] },
  { name: 'Onam Special', emoji: '🛶', discount: 10, months: [7, 8] },
];

interface FestivalDiscountsProps {
  onApplyDiscount: (discount: number) => void;
}

export function FestivalDiscounts({ onApplyDiscount }: FestivalDiscountsProps) {
  const currentMonth = new Date().getMonth();

  // Sort: seasonal ones first
  const sorted = [...FESTIVAL_DISCOUNTS].sort((a, b) => {
    const aRelevant = a.months.length === 0 || a.months.includes(currentMonth);
    const bRelevant = b.months.length === 0 || b.months.includes(currentMonth);
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return 0;
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
          <Gift className="w-3.5 h-3.5" />
          Festival Discount
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Quick-apply festival discount to all items</p>
        <div className="space-y-0.5 max-h-64 overflow-y-auto">
          {sorted.map((festival) => {
            const isSeasonal = festival.months.length === 0 || festival.months.includes(currentMonth);
            return (
              <button
                key={festival.name}
                type="button"
                onClick={() => onApplyDiscount(festival.discount)}
                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted/60 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <span>{festival.emoji}</span>
                  <span className="font-medium">{festival.name}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {isSeasonal && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Now</Badge>}
                  <span className="text-xs font-semibold text-primary">{festival.discount}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
