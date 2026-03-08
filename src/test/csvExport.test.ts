import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportInvoicesToCSV } from '@/utils/csvExport';
import type { Invoice } from '@/types';

describe('exportInvoicesToCSV', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => 'blob:test');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    // Mock link click
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
  });

  it('exports invoices without crashing', () => {
    const invoices: Invoice[] = [
      {
        id: '1',
        profile_id: 'p1',
        client_id: null,
        invoice_number: 'INW-001',
        status: 'draft',
        date_issued: '2025-01-01',
        date_due: null,
        subtotal: 1000,
        total_tax: 180,
        total_discount: 0,
        grand_total: 1180,
        payment_mode: null,
        payment_date: null,
        share_token: null,
        notes: null,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    ];

    expect(() => exportInvoicesToCSV(invoices)).not.toThrow();
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('handles empty invoices array', () => {
    expect(() => exportInvoicesToCSV([])).not.toThrow();
  });

  it('handles invoice with client', () => {
    const invoices: Invoice[] = [
      {
        id: '1',
        profile_id: 'p1',
        client_id: 'c1',
        invoice_number: 'INW-002',
        status: 'paid',
        date_issued: '2025-01-01',
        date_due: '2025-02-01',
        subtotal: 5000,
        total_tax: 900,
        total_discount: 100,
        grand_total: 5800,
        payment_mode: 'upi',
        payment_date: '2025-01-15',
        share_token: 'abc',
        notes: 'Test note',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        client: {
          id: 'c1',
          profile_id: 'p1',
          name: 'Test Client',
          email: 'test@test.com',
          phone: '9876543210',
          billing_address: 'Address',
          gstin: '27AAAAA0000A1Z5',
          state_code: '27',
          credit_balance: 0,
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      },
    ];

    expect(() => exportInvoicesToCSV(invoices)).not.toThrow();
  });
});
