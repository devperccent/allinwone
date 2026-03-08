import type { InvoiceItemFormData } from '@/types';

/** Compute the total amount for a line item: (qty * rate - discount) * (1 + tax_rate/100) */
export function computeItemAmount(item: Pick<InvoiceItemFormData, 'qty' | 'rate' | 'discount' | 'tax_rate'>): number {
  return (item.qty * item.rate - item.discount) * (1 + item.tax_rate / 100);
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createEmptyItem(): InvoiceItemFormData {
  return {
    id: generateId(),
    product_id: null,
    description: '',
    qty: 1,
    rate: 0,
    tax_rate: 18,
    discount: 0,
  };
}
