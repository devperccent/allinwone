import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Clock, Target, Trash2, ChevronRight, Timer, IndianRupee, CheckCircle2, Play, Square, FileText, Pause } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useProjects, useMilestones, useTimeEntries } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Project, Milestone, TimeEntry } from '@/hooks/useProjects';

// ─── Timer Hook ───
function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [description, setDescription] = useState('');
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('project_timer');
    if (saved) {
      const { startTime, desc, projectId } = JSON.parse(saved);
      if (startTime) {
        startTimeRef.current = startTime;
        setDescription(desc || '');
        setIsRunning(true);
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const start = useCallback((desc: string, projectId: string) => {
    const now = Date.now();
    startTimeRef.current = now;
    setDescription(desc);
    setElapsed(0);
    setIsRunning(true);
    localStorage.setItem('project_timer', JSON.stringify({ startTime: now, desc, projectId }));
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    localStorage.removeItem('project_timer');
    const hours = elapsed / 3600;
    return { hours: Math.round(hours * 100) / 100, description };
  }, [elapsed, description]);

  const discard = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setDescription('');
    localStorage.removeItem('project_timer');
  }, []);

  const formatTime = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  return { isRunning, elapsed, description, start, stop, discard, formatTime, setDescription };
}

// ─── Project Form ───
function ProjectForm({ onSubmit, clients }: { onSubmit: (data: any) => void; clients: { id: string; name: string }[] }) {
  const [form, setForm] = useState({ name: '', description: '', client_id: '', hourly_rate: '', budget: '' });
  return (
    <div className="space-y-3">
      <div><Label>Project Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Website Redesign" /></div>
      <div><Label>Client</Label>
        <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
          <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Hourly Rate (₹)</Label><Input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} placeholder="1500" /></div>
        <div><Label>Budget (₹)</Label><Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="50000" /></div>
      </div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
      <Button className="w-full" disabled={!form.name.trim()} onClick={() => onSubmit({ name: form.name, description: form.description || null, client_id: form.client_id || null, hourly_rate: Number(form.hourly_rate) || 0, budget: form.budget ? Number(form.budget) : null })}>Create Project</Button>
    </div>
  );
}

// ─── Timer Widget ───
function TimerWidget({ timer, projectId, onSave }: { timer: ReturnType<typeof useTimer>; projectId: string; onSave: (hours: number, desc: string) => void }) {
  const [timerDesc, setTimerDesc] = useState('');

  if (!timer.isRunning) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Input value={timerDesc} onChange={e => setTimerDesc(e.target.value)} placeholder="What are you working on?" className="h-8 text-sm flex-1" />
            <Button size="sm" className="h-8 gap-1.5" onClick={() => { timer.start(timerDesc || 'Work session', projectId); setTimerDesc(''); }}>
              <Play className="w-3.5 h-3.5" /> Start Timer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium truncate">{timer.description}</span>
          </div>
          <span className="text-xl font-mono font-bold tabular-nums text-primary">{timer.formatTime(timer.elapsed)}</span>
          <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => {
            const { hours, description } = timer.stop();
            if (hours >= 0.01) onSave(hours, description);
          }}>
            <Square className="w-3.5 h-3.5" /> Stop & Log
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={timer.discard}>Discard</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Invoice Generator Dialog ───
function GenerateInvoiceDialog({ project, milestones, entries, onGenerate }: {
  project: Project;
  milestones: Milestone[];
  entries: TimeEntry[];
  onGenerate: (items: { description: string; qty: number; rate: number; tax_rate: number; discount: number }[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const completedMilestones = milestones.filter(m => m.status === 'completed' && !m.invoice_id && Number(m.amount) > 0);
  const unbilledEntries = entries.filter(e => e.is_billable && !e.invoice_id);
  const unbilledHours = unbilledEntries.reduce((s, e) => s + Number(e.hours), 0);

  const [selectedMilestones, setSelectedMilestones] = useState<Set<string>>(new Set());
  const [includeTime, setIncludeTime] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMilestones(new Set(completedMilestones.map(m => m.id)));
      setIncludeTime(unbilledHours > 0);
    }
  }, [open]);

  const hasItems = selectedMilestones.size > 0 || (includeTime && unbilledHours > 0);

  const total = useMemo(() => {
    let sum = 0;
    for (const m of completedMilestones) {
      if (selectedMilestones.has(m.id)) sum += Number(m.amount);
    }
    if (includeTime) sum += unbilledHours * Number(project.hourly_rate);
    return sum;
  }, [selectedMilestones, includeTime, completedMilestones, unbilledHours, project.hourly_rate]);

  if (completedMilestones.length === 0 && unbilledHours === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
          <FileText className="w-3.5 h-3.5" /> Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Generate Invoice from Project</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Milestones */}
          {completedMilestones.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">COMPLETED MILESTONES</Label>
              {completedMilestones.map(m => (
                <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={selectedMilestones.has(m.id)} onCheckedChange={checked => {
                    setSelectedMilestones(prev => {
                      const next = new Set(prev);
                      if (checked) next.add(m.id); else next.delete(m.id);
                      return next;
                    });
                  }} />
                  <span className="flex-1 text-sm">{m.title}</span>
                  <span className="text-sm font-medium tabular-nums">{formatINR(Number(m.amount))}</span>
                </label>
              ))}
            </div>
          )}

          {/* Unbilled time */}
          {unbilledHours > 0 && (
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
              <Checkbox checked={includeTime} onCheckedChange={c => setIncludeTime(!!c)} />
              <div className="flex-1">
                <p className="text-sm font-medium">Unbilled Time</p>
                <p className="text-xs text-muted-foreground">{unbilledHours.toFixed(1)} hours × {formatINR(Number(project.hourly_rate))}/hr</p>
              </div>
              <span className="text-sm font-medium tabular-nums">{formatINR(unbilledHours * Number(project.hourly_rate))}</span>
            </label>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">{formatINR(total)}</span>
          </div>

          <Button className="w-full" disabled={!hasItems} onClick={() => {
            const items: { description: string; qty: number; rate: number; tax_rate: number; discount: number }[] = [];
            for (const m of completedMilestones) {
              if (selectedMilestones.has(m.id)) {
                items.push({ description: `${project.name} — ${m.title}`, qty: 1, rate: Number(m.amount), tax_rate: 18, discount: 0, product_id: null });
              }
            }
            if (includeTime && unbilledHours > 0) {
              items.push({ description: `${project.name} — Time-based work (${unbilledHours.toFixed(1)} hrs)`, qty: unbilledHours, rate: Number(project.hourly_rate), tax_rate: 18, discount: 0, product_id: null });
            }
            onGenerate(items);
            setOpen(false);
          }}>
            Create Invoice Draft
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Project Detail ───
function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const { milestones, createMilestone, updateMilestone } = useMilestones(project.id);
  const { entries, logTime, deleteEntry } = useTimeEntries(project.id);
  const { createInvoice } = useInvoices();
  const navigate = useNavigate();
  const { toast } = useToast();
  const timer = useTimer();
  const [mForm, setMForm] = useState({ title: '', amount: '', due_date: '' });
  const [tForm, setTForm] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });

  const totalHours = useMemo(() => entries.reduce((s, e) => s + Number(e.hours), 0), [entries]);
  const billableHours = useMemo(() => entries.filter(e => e.is_billable).reduce((s, e) => s + Number(e.hours), 0), [entries]);
  const earnedFromTime = billableHours * Number(project.hourly_rate);
  const milestoneDone = milestones.filter(m => m.status === 'completed').reduce((s, m) => s + Number(m.amount), 0);
  const milestoneTotal = milestones.reduce((s, m) => s + Number(m.amount), 0);

  const handleGenerateInvoice = async (items: { description: string; qty: number; rate: number; tax_rate: number; discount: number }[]) => {
    try {
      const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
      const totalTax = items.reduce((s, i) => s + (i.qty * i.rate * i.tax_rate / 100), 0);
      const invoice = await createInvoice({
        data: {
          client_id: project.client_id,
          date_issued: new Date().toISOString().split('T')[0],
          subtotal,
          total_tax: totalTax,
          total_discount: 0,
          grand_total: subtotal + totalTax,
          notes: `Generated from project: ${project.name}`,
        },
        items,
      });
      toast({ title: 'Invoice created!', description: 'Draft invoice generated from project.' });
      navigate(`/invoices/${invoice.id}/edit`);
    } catch (e: any) {
      toast({ title: 'Error creating invoice', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <h2 className="text-lg font-bold flex-1">{project.name}</h2>
        <GenerateInvoiceDialog project={project} milestones={milestones} entries={entries} onGenerate={handleGenerateInvoice} />
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Hours</p><p className="text-xl font-bold">{totalHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Billable Earnings</p><p className="text-xl font-bold">{formatINR(earnedFromTime)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Milestones Done</p><p className="text-xl font-bold">{formatINR(milestoneDone)}<span className="text-xs text-muted-foreground">/{formatINR(milestoneTotal)}</span></p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Budget Used</p>{project.budget ? <><Progress value={((earnedFromTime + milestoneDone) / Number(project.budget)) * 100} className="h-2 mt-1" /><p className="text-xs mt-1">{formatINR(earnedFromTime + milestoneDone)} / {formatINR(Number(project.budget))}</p></> : <p className="text-sm text-muted-foreground">No budget set</p>}</CardContent></Card>
      </div>

      <Tabs defaultValue="time">
        <TabsList>
          <TabsTrigger value="time" className="gap-1"><Timer className="w-3.5 h-3.5" />Time Log</TabsTrigger>
          <TabsTrigger value="milestones" className="gap-1"><Target className="w-3.5 h-3.5" />Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="space-y-3">
          {/* Live Timer */}
          <TimerWidget timer={timer} projectId={project.id} onSave={(hours, desc) => {
            logTime.mutate({ project_id: project.id, description: desc, hours, date: new Date().toISOString().split('T')[0], is_billable: true });
          }} />

          {/* Manual entry */}
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label className="text-xs">Description</Label><Input value={tForm.description} onChange={e => setTForm(f => ({ ...f, description: e.target.value }))} placeholder="Frontend development" className="h-8 text-sm" /></div>
            <div className="w-20"><Label className="text-xs">Hours</Label><Input type="number" step="0.25" value={tForm.hours} onChange={e => setTForm(f => ({ ...f, hours: e.target.value }))} className="h-8 text-sm" /></div>
            <div className="w-32"><Label className="text-xs">Date</Label><Input type="date" value={tForm.date} onChange={e => setTForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-sm" /></div>
            <Button size="sm" className="h-8" disabled={!tForm.hours} onClick={() => { logTime.mutate({ project_id: project.id, description: tForm.description || null, hours: Number(tForm.hours), date: tForm.date, is_billable: true }); setTForm(f => ({ ...f, description: '', hours: '' })); }}><Plus className="w-3.5 h-3.5" /></Button>
          </div>

          {entries.length === 0 ? <p className="text-center py-6 text-sm text-muted-foreground">No time entries yet. Start the timer or add manually.</p> : (
            <div className="space-y-1">
              {entries.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border text-sm">
                  <span className="text-muted-foreground w-20">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <span className="flex-1 truncate">{e.description || '—'}</span>
                  <span className="font-medium tabular-nums">{Number(e.hours).toFixed(2)}h</span>
                  {e.is_billable && <span className="text-xs text-success">{formatINR(Number(e.hours) * Number(project.hourly_rate))}</span>}
                  {!e.invoice_id && <Badge variant="outline" className="text-[10px] h-5">Unbilled</Badge>}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteEntry.mutate(e.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label className="text-xs">Title</Label><Input value={mForm.title} onChange={e => setMForm(f => ({ ...f, title: e.target.value }))} placeholder="Design mockups" className="h-8 text-sm" /></div>
            <div className="w-28"><Label className="text-xs">Amount ₹</Label><Input type="number" value={mForm.amount} onChange={e => setMForm(f => ({ ...f, amount: e.target.value }))} className="h-8 text-sm" /></div>
            <div className="w-32"><Label className="text-xs">Due</Label><Input type="date" value={mForm.due_date} onChange={e => setMForm(f => ({ ...f, due_date: e.target.value }))} className="h-8 text-sm" /></div>
            <Button size="sm" className="h-8" disabled={!mForm.title.trim()} onClick={() => { createMilestone.mutate({ project_id: project.id, title: mForm.title, amount: Number(mForm.amount) || 0, due_date: mForm.due_date || null }); setMForm({ title: '', amount: '', due_date: '' }); }}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
          {milestones.length === 0 ? <p className="text-center py-6 text-sm text-muted-foreground">No milestones yet</p> : (
            <div className="space-y-2">
              {milestones.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <button onClick={() => updateMilestone.mutate({ id: m.id, status: m.status === 'completed' ? 'pending' : 'completed', completed_at: m.status === 'completed' ? null : new Date().toISOString() })} className="flex-shrink-0">
                    <CheckCircle2 className={`w-5 h-5 ${m.status === 'completed' ? 'text-success' : 'text-muted-foreground/30'}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${m.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{m.title}</p>
                    {m.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(m.due_date).toLocaleDateString('en-IN')}</p>}
                  </div>
                  {m.invoice_id && <Badge variant="secondary" className="text-[10px] h-5">Invoiced</Badge>}
                  <span className="text-sm font-semibold tabular-nums">{formatINR(Number(m.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Projects List ───
export default function ProjectsPage() {
  const { projects, isLoading, createProject } = useProjects();
  const { clients } = useClients();
  const [selected, setSelected] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div></div>;

  if (selected) return <ProjectDetail project={selected} onBack={() => setSelected(null)} />;

  const active = projects.filter(p => p.status === 'active');
  const completed = projects.filter(p => p.status === 'completed');

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FolderKanban className="w-5 h-5" />Projects</h1>
          <p className="text-xs text-muted-foreground">Track freelance projects, milestones & time</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5 h-8 text-xs"><Plus className="w-3.5 h-3.5" />New Project</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
            <ProjectForm clients={clients} onSubmit={data => { createProject.mutate(data); setOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><FolderKanban className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No projects yet. Create your first project to start tracking.</p></CardContent></Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Active ({active.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(p => (
                  <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div><p className="font-medium text-sm">{p.name}</p>{p.client && <p className="text-xs text-muted-foreground">{p.client.name}</p>}</div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {Number(p.hourly_rate) > 0 && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{p.hourly_rate}/hr</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Number(p.total_hours).toFixed(1)}h</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Completed ({completed.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map(p => (
                  <Card key={p.id} className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity" onClick={() => setSelected(p)}>
                    <CardContent className="p-4"><p className="font-medium text-sm">{p.name}</p>{p.client && <p className="text-xs text-muted-foreground">{p.client.name}</p>}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
