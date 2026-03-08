import { useState, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, FileText, Download, AlertCircle, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

// ======================== EXCEL/CSV IMPORT ========================

interface ImportRow {
  [key: string]: string | number | null;
}

interface ColumnMapping {
  source: string;
  target: string;
}

const CLIENT_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'billing_address', label: 'Address' },
  { value: 'gstin', label: 'GSTIN' },
  { value: 'state_code', label: 'State Code' },
];

const PRODUCT_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'sku', label: 'SKU', required: true },
  { value: 'description', label: 'Description' },
  { value: 'type', label: 'Type (goods/service)' },
  { value: 'hsn_code', label: 'HSN/SAC Code' },
  { value: 'selling_price', label: 'Selling Price' },
  { value: 'tax_rate', label: 'Tax Rate %' },
  { value: 'stock_quantity', label: 'Stock Qty' },
  { value: 'low_stock_limit', label: 'Low Stock Limit' },
  { value: 'barcode', label: 'Barcode' },
];

function ExcelImport({ type }: { type: 'clients' | 'products' }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const fields = type === 'clients' ? CLIENT_FIELDS : PRODUCT_FIELDS;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: '' });

        if (json.length === 0) {
          toast({ title: 'Empty file', description: 'No data found in the file.', variant: 'destructive' });
          return;
        }

        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setRows(json.slice(0, 500)); // Limit preview

        // Auto-map by fuzzy matching
        const autoMappings: ColumnMapping[] = hdrs.map((h) => {
          const lower = h.toLowerCase().replace(/[_\s-]/g, '');
          const match = fields.find((f) => {
            const fl = f.value.toLowerCase().replace(/[_\s-]/g, '');
            const ll = f.label.toLowerCase().replace(/[_\s-]/g, '');
            return lower.includes(fl) || lower.includes(ll) || fl.includes(lower) || ll.includes(lower);
          });
          return { source: h, target: match?.value || '' };
        });
        setMappings(autoMappings);
      } catch {
        toast({ title: 'Error reading file', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!profile?.id) return;
    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    const batch = rows.map((row) => {
      const mapped: Record<string, any> = { profile_id: profile.id };
      mappings.forEach((m) => {
        if (m.target && m.source) {
          let val = row[m.source];
          if (m.target === 'selling_price' || m.target === 'tax_rate' || m.target === 'stock_quantity' || m.target === 'low_stock_limit') {
            val = Number(val) || 0;
          }
          mapped[m.target] = val;
        }
      });

      if (type === 'products') {
        if (!mapped.sku) mapped.sku = `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        if (!mapped.type) mapped.type = 'goods';
      }
      if (type === 'clients') {
        if (!mapped.state_code) mapped.state_code = '27';
      }

      return mapped;
    });

    // Insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);
      const validChunk = chunk.filter((r) => type === 'clients' ? r.name : (r.name && r.sku));

      if (validChunk.length > 0) {
        const { error } = await supabase.from(type as any).insert(validChunk as any);
        if (error) {
          failed += validChunk.length;
        } else {
          success += validChunk.length;
        }
      } else {
        failed += chunk.length;
      }

      setProgress(Math.round(((i + chunkSize) / batch.length) * 100));
    }

    setResult({ success, failed });
    setImporting(false);
    toast({
      title: 'Import complete',
      description: `${success} imported, ${failed} failed.`,
    });
  };

  const mappedCount = mappings.filter((m) => m.target).length;

  return (
    <div className="space-y-4">
      <div>
        <Label>Upload Excel or CSV file</Label>
        <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="mt-1" />
      </div>

      {headers.length > 0 && (
        <>
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>{rows.length} rows found. Map columns below, then click Import.</AlertDescription></Alert>

          <Card>
            <CardHeader><CardTitle className="text-base">Column Mapping</CardTitle><CardDescription>{mappedCount} of {headers.length} columns mapped</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {headers.map((h) => {
                  const mapping = mappings.find((m) => m.source === h);
                  return (
                    <div key={h} className="flex items-center gap-3">
                      <span className="text-sm font-mono w-40 truncate" title={h}>{h}</span>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={mapping?.target || 'skip'}
                        onValueChange={(v) => setMappings((prev) => prev.map((m) => m.source === h ? { ...m, target: v === 'skip' ? '' : v } : m))}
                      >
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">— Skip —</SelectItem>
                          {fields.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}{('required' in f && f.required) ? ' *' : ''}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader><CardTitle className="text-base">Preview (first 5 rows)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {mappings.filter((m) => m.target).map((m) => <TableHead key={m.source}>{fields.find((f) => f.value === m.target)?.label || m.target}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {mappings.filter((m) => m.target).map((m) => <TableCell key={m.source} className="text-sm">{String(row[m.source] ?? '')}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {importing && <Progress value={progress} />}

          {result && (
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" /> {result.success} imported</Badge>
              {result.failed > 0 && <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" /> {result.failed} failed</Badge>}
            </div>
          )}

          <Button onClick={handleImport} disabled={importing || mappedCount === 0} className="w-full">
            {importing ? 'Importing...' : `Import ${rows.length} ${type}`}
          </Button>
        </>
      )}
    </div>
  );
}

// ======================== TALLY XML IMPORT ========================

function TallyImport() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ clients: number; products: number } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      // Parse ledgers → clients
      const ledgers = xml.querySelectorAll('LEDGER');
      const clientData: any[] = [];
      ledgers.forEach((ledger) => {
        const parent = ledger.querySelector('PARENT')?.textContent?.toLowerCase() || '';
        if (parent.includes('sundry debtor') || parent.includes('sundry creditor')) {
          const name = ledger.getAttribute('NAME') || ledger.querySelector('NAME')?.textContent || '';
          const address = ledger.querySelector('ADDRESS')?.textContent || '';
          const gstin = ledger.querySelector('PARTYGSTIN')?.textContent || ledger.querySelector('GSTREGISTRATIONNUMBER')?.textContent || '';
          const state = ledger.querySelector('LEDSTATENAME')?.textContent || '';
          const phone = ledger.querySelector('LEDGERPHONE')?.textContent || '';
          const email = ledger.querySelector('EMAIL')?.textContent || '';

          if (name) {
            clientData.push({
              profile_id: profile.id,
              name: name.trim(),
              billing_address: address?.trim() || null,
              gstin: gstin?.trim() || null,
              phone: phone?.trim() || null,
              email: email?.trim() || null,
              state_code: '27', // Default to Maharashtra
            });
          }
        }
      });

      // Parse stock items → products
      const stockItems = xml.querySelectorAll('STOCKITEM');
      const productData: any[] = [];
      stockItems.forEach((item) => {
        const name = item.getAttribute('NAME') || item.querySelector('NAME')?.textContent || '';
        const rate = parseFloat(item.querySelector('RATEOFSELLINGPRICE')?.textContent || item.querySelector('STANDARDPRICE')?.textContent || '0');
        const qty = parseFloat(item.querySelector('OPENINGBALANCE')?.textContent || '0');
        const hsn = item.querySelector('HSNCODE')?.textContent || '';
        const gstRate = parseFloat(item.querySelector('GSTRATE')?.textContent || '18');

        if (name) {
          productData.push({
            profile_id: profile.id,
            name: name.trim(),
            sku: `TALLY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            selling_price: rate || 0,
            stock_quantity: Math.max(0, Math.round(qty)),
            hsn_code: hsn?.trim() || null,
            tax_rate: gstRate || 18,
            type: 'goods',
          });
        }
      });

      // Bulk insert
      let clientCount = 0;
      let productCount = 0;

      if (clientData.length > 0) {
        const { error } = await supabase.from('clients').insert(clientData);
        if (!error) clientCount = clientData.length;
      }
      if (productData.length > 0) {
        const { error } = await supabase.from('products').insert(productData as any);
        if (!error) productCount = productData.length;
      }

      setResult({ clients: clientCount, products: productCount });
      toast({ title: 'Tally import complete', description: `${clientCount} clients, ${productCount} products imported.` });
    } catch {
      toast({ title: 'Error parsing Tally XML', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Export your data from Tally as XML (Gateway → Export → Masters) and upload it here.</AlertDescription></Alert>
      <div>
        <Label>Upload Tally XML file</Label>
        <Input type="file" accept=".xml" onChange={handleFile} disabled={importing} className="mt-1" />
      </div>
      {importing && <p className="text-sm text-muted-foreground">Parsing and importing...</p>}
      {result && (
        <div className="flex gap-3">
          <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{result.clients} clients</Badge>
          <Badge variant="outline" className="gap-1"><Check className="w-3 h-3" />{result.products} products</Badge>
        </div>
      )}
    </div>
  );
}

// ======================== TALLY XML EXPORT ========================

function TallyExport() {
  const { profile } = useAuth();
  const { clients } = useClients();
  const { products } = useProducts();
  const { invoices } = useInvoices();

  const exportTallyXML = () => {
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ENVELOPE>',
      '<HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>',
      '<BODY>',
      '<IMPORTDATA>',
      '<REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>',
      '<REQUESTDATA>',
    ];

    // Export clients as ledgers
    clients.forEach((c) => {
      lines.push('<TALLYMESSAGE xmlns:UDF="TallyUDF">');
      lines.push(`<LEDGER NAME="${escapeXml(c.name)}" ACTION="Create">`);
      lines.push(`<NAME>${escapeXml(c.name)}</NAME>`);
      lines.push('<PARENT>Sundry Debtors</PARENT>');
      if (c.billing_address) lines.push(`<ADDRESS>${escapeXml(c.billing_address)}</ADDRESS>`);
      if (c.gstin) lines.push(`<PARTYGSTIN>${escapeXml(c.gstin)}</PARTYGSTIN>`);
      if (c.email) lines.push(`<EMAIL>${escapeXml(c.email)}</EMAIL>`);
      if (c.phone) lines.push(`<LEDGERPHONE>${escapeXml(c.phone)}</LEDGERPHONE>`);
      lines.push('</LEDGER>');
      lines.push('</TALLYMESSAGE>');
    });

    // Export products as stock items
    products.forEach((p) => {
      lines.push('<TALLYMESSAGE xmlns:UDF="TallyUDF">');
      lines.push(`<STOCKITEM NAME="${escapeXml(p.name)}" ACTION="Create">`);
      lines.push(`<NAME>${escapeXml(p.name)}</NAME>`);
      if (p.hsn_code) lines.push(`<HSNCODE>${escapeXml(p.hsn_code)}</HSNCODE>`);
      lines.push(`<GSTRATE>${p.tax_rate}</GSTRATE>`);
      lines.push(`<RATEOFSELLINGPRICE>${p.selling_price}</RATEOFSELLINGPRICE>`);
      lines.push(`<OPENINGBALANCE>${p.stock_quantity} Nos</OPENINGBALANCE>`);
      lines.push('</STOCKITEM>');
      lines.push('</TALLYMESSAGE>');
    });

    lines.push('</REQUESTDATA>', '</IMPORTDATA>', '</BODY>', '</ENVELOPE>');

    const blob = new Blob([lines.join('\n')], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally-export-${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = (type: 'clients' | 'products' | 'invoices') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'clients') {
      data = clients.map((c) => ({
        Name: c.name, Email: c.email || '', Phone: c.phone || '',
        Address: c.billing_address || '', GSTIN: c.gstin || '', State: c.state_code,
        'Credit Balance': c.credit_balance,
      }));
      filename = 'clients-export';
    } else if (type === 'products') {
      data = products.map((p) => ({
        Name: p.name, SKU: p.sku, Type: p.type,
        'HSN Code': p.hsn_code || '', Price: p.selling_price, 'Tax Rate': p.tax_rate,
        Stock: p.stock_quantity, 'Low Stock Limit': p.low_stock_limit,
        Barcode: (p as any).barcode || '',
      }));
      filename = 'products-export';
    } else {
      data = invoices.map((i) => ({
        'Invoice #': i.invoice_number, Client: i.client?.name || 'Walk-in',
        Date: i.date_issued, 'Due Date': i.date_due || '', Status: i.status,
        Subtotal: i.subtotal, Tax: i.total_tax, Discount: i.total_discount,
        Total: i.grand_total, 'Payment Mode': i.payment_mode || '',
      }));
      filename = 'invoices-export';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportExcel('clients')}>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileSpreadsheet className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-medium text-sm">Export Clients (Excel)</p>
              <p className="text-xs text-muted-foreground">{clients.length} clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportExcel('products')}>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileSpreadsheet className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-medium text-sm">Export Products (Excel)</p>
              <p className="text-xs text-muted-foreground">{products.length} products</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportExcel('invoices')}>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileSpreadsheet className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-medium text-sm">Export Invoices (Excel)</p>
              <p className="text-xs text-muted-foreground">{invoices.length} invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={exportTallyXML}>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><FileText className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="font-medium text-sm">Export to Tally (XML)</p>
              <p className="text-xs text-muted-foreground">{clients.length} clients + {products.length} products</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ======================== MAIN PAGE ========================

export default function BulkImportExportPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">Data Manager</h1>
      </div>

      <Tabs defaultValue="import-excel" className="space-y-6">
        <TabsList className="bg-muted/50 w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="import-excel" className="gap-1.5 text-xs sm:text-sm">
            <Upload className="w-3.5 h-3.5" /><span>Excel Import</span>
          </TabsTrigger>
          <TabsTrigger value="import-tally" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /><span>Tally Import</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5 text-xs sm:text-sm">
            <Download className="w-3.5 h-3.5" /><span>Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import-excel" className="space-y-6">
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">Import Clients</TabsTrigger>
              <TabsTrigger value="products">Import Products</TabsTrigger>
            </TabsList>
            <TabsContent value="clients" className="pt-4"><ExcelImport type="clients" /></TabsContent>
            <TabsContent value="products" className="pt-4"><ExcelImport type="products" /></TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="import-tally"><TallyImport /></TabsContent>
        <TabsContent value="export"><TallyExport /></TabsContent>
      </Tabs>
    </div>
  );
}
