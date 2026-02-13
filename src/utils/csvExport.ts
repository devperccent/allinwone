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
    (inv as any).payment_date || '',
  ]);

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
  link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
