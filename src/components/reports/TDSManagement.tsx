import { useState } from 'react';
import { Plus, Download, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useTDSEntries, type TDSEntry } from '@/hooks/useTDSEntries';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useToast } from '@/hooks/use-toast';

const TDS_SECTIONS = [
  { value: '194C', label: '194C - Contractor (1%/2%)', rate: 2 },
  { value: '194J', label: '194J - Professional (10%)', rate: 10 },
  { value: '194H', label: '194H - Commission (5%)', rate: 5 },
  { value: '194I', label: '194I - Rent (10%)', rate: 10 },
  { value: '194A', label: '194A - Interest (10%)', rate: 10 },
  { value: '194Q', label: '194Q - Purchase of Goods (0.1%)', rate: 0.1 },
];

function getCurrentFY() {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${fy}-${(fy + 1).toString().slice(2)}`;
}

function getCurrentQuarter() {
  const m = new Date().getMonth();
  if (m >= 3 && m <= 5) return 'Q1';
  if (m >= 6 && m <= 8) return 'Q2';
  if (m >= 9 && m <= 11) return 'Q3';
  return 'Q4';
}

// PDF certificate styles
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontWeight: 'bold' },
  section: { marginBottom: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 8, color: '#666' },
});

function TDSCertificateDoc({ entry, profileName, profilePan }: { entry: TDSEntry; profileName: string; profilePan: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>TDS Certificate</Text>
        <Text style={styles.subtitle}>Form 16A (Approximate)</Text>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.label}>Certificate No:</Text><Text>{entry.certificate_number || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Financial Year:</Text><Text>{entry.financial_year}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Quarter:</Text><Text>{entry.quarter}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Deductee Details (Your Business):</Text>
          <View style={styles.row}><Text>Name:</Text><Text>{profileName}</Text></View>
          <View style={styles.row}><Text>PAN:</Text><Text>{profilePan || 'N/A'}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Deductor Details:</Text>
          <View style={styles.row}><Text>Name:</Text><Text>{entry.client?.name || 'N/A'}</Text></View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 8 }]}>TDS Details:</Text>
          <View style={styles.row}><Text>Section:</Text><Text>{entry.tds_section}</Text></View>
          <View style={styles.row}><Text>Gross Amount:</Text><Text>₹{Number(entry.gross_amount).toFixed(2)}</Text></View>
          <View style={styles.row}><Text>TDS Rate:</Text><Text>{entry.tds_rate}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>TDS Amount:</Text><Text style={styles.label}>₹{Number(entry.tds_amount).toFixed(2)}</Text></View>
          <View style={styles.row}><Text>Date Deducted:</Text><Text>{entry.date_deducted}</Text></View>
        </View>
        <View style={styles.divider} />
        {entry.invoice?.invoice_number && (
          <View style={styles.row}><Text>Related Invoice:</Text><Text>{entry.invoice.invoice_number}</Text></View>
        )}
        <Text style={styles.footer}>This is a computer-generated document. Please verify details with Form 26AS.</Text>
      </Page>
    </Document>
  );
}

export function TDSManagement() {
  const { profile } = useAuth();
  const { entries, isLoading, createEntry, deleteEntry } = useTDSEntries();
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    client_id: '',
    invoice_id: '',
    tds_section: '194C',
    tds_rate: 2,
    gross_amount: 0,
    date_deducted: new Date().toISOString().split('T')[0],
    certificate_number: '',
    financial_year: getCurrentFY(),
    quarter: getCurrentQuarter(),
    notes: '',
  });

  const tdsAmount = (form.gross_amount * form.tds_rate) / 100;

  const handleSectionChange = (section: string) => {
    const sec = TDS_SECTIONS.find((s) => s.value === section);
    setForm((f) => ({ ...f, tds_section: section, tds_rate: sec?.rate || 2 }));
  };

  const handleSubmit = async () => {
    await createEntry.mutateAsync({
      client_id: form.client_id || null,
      invoice_id: form.invoice_id || null,
      tds_section: form.tds_section,
      tds_rate: form.tds_rate,
      tds_amount: tdsAmount,
      gross_amount: form.gross_amount,
      date_deducted: form.date_deducted,
      certificate_number: form.certificate_number || null,
      financial_year: form.financial_year,
      quarter: form.quarter,
      notes: form.notes || null,
    });
    setDialogOpen(false);
    setForm({
      client_id: '', invoice_id: '', tds_section: '194C', tds_rate: 2,
      gross_amount: 0, date_deducted: new Date().toISOString().split('T')[0],
      certificate_number: '', financial_year: getCurrentFY(), quarter: getCurrentQuarter(), notes: '',
    });
  };

  const downloadCertificate = async (entry: TDSEntry) => {
    try {
      const blob = await pdf(
        <TDSCertificateDoc entry={entry} profileName={profile?.org_name || ''} profilePan={profile?.pan_number || ''} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TDS-Certificate-${entry.tds_section}-${entry.date_deducted}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Error generating certificate', variant: 'destructive' });
    }
  };

  // Summary by section
  const totalTDS = entries.reduce((s, e) => s + Number(e.tds_amount), 0);
  const sectionSummary = entries.reduce((acc, e) => {
    acc[e.tds_section] = (acc[e.tds_section] || 0) + Number(e.tds_amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total TDS deducted: <span className="font-semibold text-foreground">{formatINR(totalTDS)}</span></p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add TDS Entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Record TDS Deduction</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Client (Deductor)</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Invoice (optional)</Label>
                  <Select value={form.invoice_id} onValueChange={(v) => setForm((f) => ({ ...f, invoice_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Link invoice" /></SelectTrigger>
                    <SelectContent>
                      {invoices.filter((i) => i.status === 'paid' || i.status === 'finalized').map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.invoice_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>TDS Section</Label>
                  <Select value={form.tds_section} onValueChange={handleSectionChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TDS_SECTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gross Amount</Label>
                  <Input type="number" value={form.gross_amount || ''} onChange={(e) => setForm((f) => ({ ...f, gross_amount: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Rate (%)</Label>
                  <Input type="number" step="0.1" value={form.tds_rate} onChange={(e) => setForm((f) => ({ ...f, tds_rate: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>TDS Amount</Label>
                  <Input value={formatINR(tdsAmount)} disabled />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date_deducted} onChange={(e) => setForm((f) => ({ ...f, date_deducted: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>FY</Label>
                  <Input value={form.financial_year} onChange={(e) => setForm((f) => ({ ...f, financial_year: e.target.value }))} />
                </div>
                <div>
                  <Label>Quarter</Label>
                  <Select value={form.quarter} onValueChange={(v) => setForm((f) => ({ ...f, quarter: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Certificate #</Label>
                  <Input value={form.certificate_number} onChange={(e) => setForm((f) => ({ ...f, certificate_number: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={createEntry.isPending || form.gross_amount <= 0} className="w-full">
                {createEntry.isPending ? 'Saving...' : 'Save TDS Entry'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Section Summary */}
      {Object.keys(sectionSummary).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(sectionSummary).map(([sec, amt]) => (
            <Badge key={sec} variant="outline" className="px-3 py-1">
              {sec}: {formatINR(amt)}
            </Badge>
          ))}
        </div>
      )}

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">TDS Entries</CardTitle>
          <CardDescription>Track TDS deducted by your clients</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No TDS entries yet. Click "Add TDS Entry" to record deductions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead>FY / Qtr</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{e.date_deducted}</TableCell>
                      <TableCell className="text-sm">{e.client?.name || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{e.tds_section}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{formatINR(Number(e.gross_amount))}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatINR(Number(e.tds_amount))}</TableCell>
                      <TableCell className="text-sm">{e.financial_year} {e.quarter}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadCertificate(e)} title="Download Certificate">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry.mutate(e.id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
