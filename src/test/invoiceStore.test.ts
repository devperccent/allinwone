import { describe, it, expect, beforeEach } from 'vitest';
import { useInvoiceStore } from '@/stores/invoiceStore';

describe('invoiceStore', () => {
  beforeEach(() => {
    useInvoiceStore.getState().resetInvoice();
  });

  it('has initial state', () => {
    const state = useInvoiceStore.getState();
    expect(state.selectedClientId).toBeNull();
    expect(state.selectedClient).toBeNull();
    expect(state.items).toHaveLength(1);
    expect(state.notes).toBeNull();
    expect(state.dateDue).toBeNull();
  });

  it('sets selected client', () => {
    const client = {
      id: 'c1', profile_id: 'p1', name: 'Test', email: null,
      phone: null, billing_address: null, gstin: null, state_code: '27',
      credit_balance: 0, created_at: '', updated_at: '',
    };
    useInvoiceStore.getState().setSelectedClient(client);
    const state = useInvoiceStore.getState();
    expect(state.selectedClient?.name).toBe('Test');
    expect(state.selectedClientId).toBe('c1');
  });

  it('clears client on null', () => {
    useInvoiceStore.getState().setSelectedClient(null);
    expect(useInvoiceStore.getState().selectedClientId).toBeNull();
  });

  it('sets dates', () => {
    useInvoiceStore.getState().setDateIssued('2025-06-01');
    useInvoiceStore.getState().setDateDue('2025-07-01');
    const state = useInvoiceStore.getState();
    expect(state.dateIssued).toBe('2025-06-01');
    expect(state.dateDue).toBe('2025-07-01');
  });

  it('sets notes', () => {
    useInvoiceStore.getState().setNotes('Test note');
    expect(useInvoiceStore.getState().notes).toBe('Test note');
  });

  it('adds items', () => {
    useInvoiceStore.getState().addItem();
    expect(useInvoiceStore.getState().items).toHaveLength(2);
  });

  it('removes items', () => {
    const id = useInvoiceStore.getState().items[0].id;
    useInvoiceStore.getState().addItem();
    useInvoiceStore.getState().removeItem(id);
    expect(useInvoiceStore.getState().items).toHaveLength(1);
  });

  it('updates items', () => {
    const id = useInvoiceStore.getState().items[0].id;
    useInvoiceStore.getState().updateItem(id, { description: 'Widget', rate: 500, qty: 3 });
    const item = useInvoiceStore.getState().items[0];
    expect(item.description).toBe('Widget');
    expect(item.rate).toBe(500);
    expect(item.qty).toBe(3);
  });

  it('reorders items', () => {
    useInvoiceStore.getState().addItem();
    useInvoiceStore.getState().addItem();
    const items = useInvoiceStore.getState().items;
    const [first, , third] = items;
    
    useInvoiceStore.getState().reorderItems(third.id, first.id);
    const reordered = useInvoiceStore.getState().items;
    expect(reordered[0].id).toBe(third.id);
  });

  it('reorder does nothing with invalid ids', () => {
    const before = useInvoiceStore.getState().items;
    useInvoiceStore.getState().reorderItems('fake-1', 'fake-2');
    expect(useInvoiceStore.getState().items).toEqual(before);
  });

  it('resets invoice state', () => {
    useInvoiceStore.getState().setNotes('note');
    useInvoiceStore.getState().addItem();
    useInvoiceStore.getState().resetInvoice();
    const state = useInvoiceStore.getState();
    expect(state.notes).toBeNull();
    expect(state.items).toHaveLength(1);
    expect(state.selectedClientId).toBeNull();
  });

  it('sets profile', () => {
    useInvoiceStore.getState().setProfile({
      id: 'p1', user_id: 'u1', org_name: 'Test', email: 'a@b.com',
      phone: null, gstin: null, address: null, state_code: '27',
      logo_url: null, upi_vpa: null, invoice_prefix: 'INW-',
      next_invoice_number: 1, onboarding_completed: true,
      business_type: null, pan_number: null, bank_account_name: null,
      bank_account_number: null, bank_ifsc: null, enabled_modules: [],
      created_at: '', updated_at: '',
    });
    expect(useInvoiceStore.getState().profile?.org_name).toBe('Test');
  });
});
