import { useMemo } from 'react';
import type { InvoiceItemFormData, GSTType, InvoiceCalculation, ItemCalculation, GSTBreakdown } from '@/types';

interface UseInvoiceCalculationsProps {
  items: InvoiceItemFormData[];
  profileStateCode: string;
  clientStateCode: string | null;
}

export function useInvoiceCalculations({
  items,
  profileStateCode,
  clientStateCode,
}: UseInvoiceCalculationsProps): InvoiceCalculation {
  return useMemo(() => {
    // Determine GST type based on state codes
    const gstType: GSTType = 
      !clientStateCode || profileStateCode === clientStateCode 
        ? 'intra-state' 
        : 'inter-state';

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    const itemCalculations: ItemCalculation[] = items.map((item) => {
      // Base amount = qty * rate
      const baseAmount = item.qty * item.rate;
      
      // Discount amount
      const discountAmount = item.discount || 0;
      
      // Taxable amount after discount
      const taxableAmount = baseAmount - discountAmount;
      
      // Tax calculation
      const taxRate = item.tax_rate / 100;
      const taxAmount = taxableAmount * taxRate;
      
      // Total amount for this item
      const totalAmount = taxableAmount + taxAmount;

      // Accumulate totals
      subtotal += baseAmount;
      totalTax += taxAmount;
      totalDiscount += discountAmount;

      // Split tax for GST breakdown
      if (gstType === 'intra-state') {
        cgst += taxAmount / 2;
        sgst += taxAmount / 2;
      } else {
        igst += taxAmount;
      }

      return {
        itemId: item.id,
        baseAmount,
        taxAmount,
        discountAmount,
        totalAmount,
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    const gstBreakdown: GSTBreakdown = {
      type: gstType,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
    };

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      gstBreakdown,
      itemCalculations,
    };
  }, [items, profileStateCode, clientStateCode]);
}

// Utility function to format currency in Indian format
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Utility to convert number to words (Indian system)
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  
  const numStr = Math.floor(num).toString();
  
  function convertSection(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertSection(n % 100) : '');
  }

  let result = '';
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);

  if (crores) result += convertSection(crores) + ' Crore ';
  if (lakhs) result += convertSection(lakhs) + ' Lakh ';
  if (thousands) result += convertSection(thousands) + ' Thousand ';
  if (remainder) result += convertSection(remainder);

  const paise = Math.round((num - Math.floor(num)) * 100);
  if (paise) result += ' and ' + convertSection(paise) + ' Paise';

  return result.trim() + ' Only';
}
