import type { Invoice } from '@/types';

export function exportInvoicesToCSV(invoices: Invoice[]) {
  const headers = [
    'Invoice Number',
    'Client',
    'Date Issued',
    'Due Date',
    'Subtotal',
    'Tax',
    'Discount',
    'Grand Total',
    'Status',
    'Payment Mode',
    'Payment Date',
  ];

  const rows = invoices.map((inv) => [
    inv.invoice_number,
    inv.client?.name || 'Walk-in Customer',
    inv.date_issued,
    inv.date_due || '',
    Number(inv.subtotal).toFixed(2),
    Number(inv.total_tax).toFixed(2),
    Number(inv.total_discount).toFixed(2),
    Number(inv.grand_total).toFixed(2),
    inv.status,
    inv.payment_mode || '',
    inv.payment_date || '',
  ]);

  downloadCSV(headers, rows, `invoices-export-${new Date().toISOString().split('T')[0]}.csv`);
}

interface GSTAnalysis {
  totalTaxable: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTax: number;
  invoiceCount: number;
  rateWise: { rate: number; taxable: number; cgst: number; sgst: number; igst: number; total: number; count: number }[];
  hsnWise: { hsn: string; description: string; taxable: number; cgst: number; sgst: number; igst: number; total: number; qty: number }[];
  stateWise: { state: string; taxable: number; tax: number; count: number }[];
}

export function exportGSTReportCSV(analysis: GSTAnalysis, periodLabel: string) {
  const lines: string[] = [];
  
  // Summary section
  lines.push(`GST Report - ${periodLabel}`);
  lines.push('');
  lines.push('Summary');
  lines.push(`Total Invoices,${analysis.invoiceCount}`);
  lines.push(`Total Taxable Value,${analysis.totalTaxable.toFixed(2)}`);
  lines.push(`CGST,${analysis.totalCGST.toFixed(2)}`);
  lines.push(`SGST,${analysis.totalSGST.toFixed(2)}`);
  lines.push(`IGST,${analysis.totalIGST.toFixed(2)}`);
  lines.push(`Total Tax,${analysis.totalTax.toFixed(2)}`);
  lines.push('');

  // Rate-wise section
  lines.push('Rate-wise Tax Summary');
  lines.push('Rate %,Taxable Value,CGST,SGST,IGST,Total Tax,Items');
  analysis.rateWise.forEach((r) => {
    lines.push(`${r.rate}%,${r.taxable.toFixed(2)},${r.cgst.toFixed(2)},${r.sgst.toFixed(2)},${r.igst.toFixed(2)},${r.total.toFixed(2)},${r.count}`);
  });
  lines.push('');

  // HSN-wise section
  lines.push('HSN-wise Summary');
  lines.push('HSN/SAC,Description,Qty,Taxable Value,CGST,SGST,IGST,Total Tax');
  analysis.hsnWise.forEach((h) => {
    lines.push(`"${h.hsn}","${h.description.replace(/"/g, '""')}",${h.qty},${h.taxable.toFixed(2)},${h.cgst.toFixed(2)},${h.sgst.toFixed(2)},${h.igst.toFixed(2)},${h.total.toFixed(2)}`);
  });
  lines.push('');

  // State-wise section
  lines.push('State-wise Supply Summary');
  lines.push('State,Invoices,Taxable Value,Tax Amount');
  analysis.stateWise.forEach((s) => {
    lines.push(`"${s.state}",${s.count},${s.taxable.toFixed(2)},${s.tax.toFixed(2)}`);
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gst-report-${periodLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
