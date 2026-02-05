import { create } from 'zustand';
import type { InvoiceItemFormData, Client, Profile } from '@/types';

// Simple UUID generator for client-side
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface InvoiceStore {
  // Current invoice state
  selectedClientId: string | null;
  selectedClient: Client | null;
  dateIssued: string;
  dateDue: string | null;
  notes: string | null;
  items: InvoiceItemFormData[];
  
  // Profile state
  profile: Profile | null;
  
  // Actions
  setProfile: (profile: Profile | null) => void;
  setSelectedClient: (client: Client | null) => void;
  setDateIssued: (date: string) => void;
  setDateDue: (date: string | null) => void;
  setNotes: (notes: string | null) => void;
  
  // Item actions
  addItem: () => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<InvoiceItemFormData>) => void;
  reorderItems: (activeId: string, overId: string) => void;
  
  // Reset
  resetInvoice: () => void;
}

const createEmptyItem = (): InvoiceItemFormData => ({
  id: generateId(),
  product_id: null,
  description: '',
  qty: 1,
  rate: 0,
  tax_rate: 18,
  discount: 0,
});

const today = new Date().toISOString().split('T')[0];

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  selectedClientId: null,
  selectedClient: null,
  dateIssued: today,
  dateDue: null,
  notes: null,
  items: [createEmptyItem()],
  profile: null,

  setProfile: (profile) => set({ profile }),
  
  setSelectedClient: (client) => set({ 
    selectedClient: client,
    selectedClientId: client?.id || null,
  }),
  
  setDateIssued: (date) => set({ dateIssued: date }),
  setDateDue: (date) => set({ dateDue: date }),
  setNotes: (notes) => set({ notes }),
  
  addItem: () => set((state) => ({
    items: [...state.items, createEmptyItem()],
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  
  reorderItems: (activeId, overId) => set((state) => {
    const oldIndex = state.items.findIndex((item) => item.id === activeId);
    const newIndex = state.items.findIndex((item) => item.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return state;
    
    const newItems = [...state.items];
    const [removed] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, removed);
    
    return { items: newItems };
  }),
  
  resetInvoice: () => set({
    selectedClientId: null,
    selectedClient: null,
    dateIssued: today,
    dateDue: null,
    notes: null,
    items: [createEmptyItem()],
  }),
}));
