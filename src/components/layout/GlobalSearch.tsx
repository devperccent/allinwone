import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Package, Users, BarChart3 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';

const NAV_PAGES = [
  { label: 'Dashboard', path: '/', description: 'Overview & stats' },
  { label: 'Invoices', path: '/invoices', description: 'Manage invoices' },
  { label: 'Clients', path: '/clients', description: 'Manage clients' },
  { label: 'Products', path: '/products', description: 'Manage products & inventory' },
  { label: 'Reports', path: '/reports', description: 'Analytics & reports' },
  { label: 'Settings', path: '/settings', description: 'Business settings' },
  { label: 'New Invoice', path: '/invoices/new', description: 'Create a new invoice' },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  
  // Only fetch data when search is open
  const { invoices } = useInvoices({ enabled: open });
  const { clients } = useClients({ enabled: open });
  const { products } = useProducts({ enabled: open });

  const topInvoices = useMemo(() => invoices.slice(0, 8), [invoices]);
  const topClients = useMemo(() => clients.slice(0, 8), [clients]);
  const topProducts = useMemo(() => products.slice(0, 8), [products]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search invoices, clients, products, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {NAV_PAGES.map((page) => (
            <CommandItem
              key={page.path + page.label}
              onSelect={() => handleSelect(page.path)}
              value={`${page.label} ${page.description}`}
            >
              <BarChart3 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{page.label}</span>
                <span className="text-xs text-muted-foreground">{page.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {topInvoices.length > 0 && (
          <CommandGroup heading="Invoices">
            {topInvoices.map((inv) => (
              <CommandItem
                key={inv.id}
                onSelect={() => handleSelect(`/invoices/${inv.id}`)}
                value={`${inv.invoice_number} ${inv.client?.name || ''} ${inv.status} ${inv.grand_total}`}
              >
                <FileText className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="text-xs text-muted-foreground capitalize">({inv.status})</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {inv.client?.name || 'No client'} · ₹{Number(inv.grand_total).toLocaleString('en-IN')}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {topClients.length > 0 && (
          <CommandGroup heading="Clients">
            {topClients.map((client) => (
              <CommandItem
                key={client.id}
                onSelect={() => handleSelect('/clients')}
                value={`${client.name} ${client.email || ''} ${client.phone || ''} ${client.gstin || ''}`}
              >
                <Users className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{client.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.email || client.phone || 'No contact info'}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {topProducts.length > 0 && (
          <CommandGroup heading="Products">
            {topProducts.map((product) => (
              <CommandItem
                key={product.id}
                onSelect={() => handleSelect('/products')}
                value={`${product.name} ${product.sku} ${product.hsn_code || ''} ${product.type}`}
              >
                <Package className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {product.sku} · ₹{Number(product.selling_price).toLocaleString('en-IN')} · {product.type}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
