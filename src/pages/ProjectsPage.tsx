import { useState, useMemo } from 'react';
import { Plus, FolderKanban, Clock, Target, Trash2, ChevronRight, Timer, IndianRupee, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useProjects, useMilestones, useTimeEntries } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '@/hooks/useProjects';

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

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const { milestones, createMilestone, updateMilestone } = useMilestones(project.id);
  const { entries, logTime, deleteEntry } = useTimeEntries(project.id);
  const [mForm, setMForm] = useState({ title: '', amount: '', due_date: '' });
  const [tForm, setTForm] = useState({ description: '', hours: '', date: new Date().toISOString().split('T')[0] });

  const totalHours = useMemo(() => entries.reduce((s, e) => s + Number(e.hours), 0), [entries]);
  const billableHours = useMemo(() => entries.filter(e => e.is_billable).reduce((s, e) => s + Number(e.hours), 0), [entries]);
  const earnedFromTime = billableHours * Number(project.hourly_rate);
  const milestoneDone = milestones.filter(m => m.status === 'completed').reduce((s, m) => s + Number(m.amount), 0);
  const milestoneTotal = milestones.reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <h2 className="text-lg font-bold flex-1">{project.name}</h2>
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Hours</p><p className="text-xl font-bold">{totalHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Billable Earnings</p><p className="text-xl font-bold">{formatINR(earnedFromTime)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Milestones Done</p><p className="text-xl font-bold">{formatINR(milestoneDone)}<span className="text-xs text-muted-foreground">/{formatINR(milestoneTotal)}</span></p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Budget Used</p>{project.budget ? <><Progress value={((earnedFromTime + milestoneDone) / Number(project.budget)) * 100} className="h-2 mt-1" /><p className="text-xs mt-1">{formatINR(earnedFromTime + milestoneDone)} / {formatINR(Number(project.budget))}</p></> : <p className="text-sm text-muted-foreground">No budget set</p>}</CardContent></Card>
      </div>

      <Tabs defaultValue="milestones">
        <TabsList><TabsTrigger value="milestones" className="gap-1"><Target className="w-3.5 h-3.5" />Milestones</TabsTrigger><TabsTrigger value="time" className="gap-1"><Timer className="w-3.5 h-3.5" />Time Log</TabsTrigger></TabsList>

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
                  <span className="text-sm font-semibold tabular-nums">{formatINR(Number(m.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="time" className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label className="text-xs">Description</Label><Input value={tForm.description} onChange={e => setTForm(f => ({ ...f, description: e.target.value }))} placeholder="Frontend development" className="h-8 text-sm" /></div>
            <div className="w-20"><Label className="text-xs">Hours</Label><Input type="number" step="0.25" value={tForm.hours} onChange={e => setTForm(f => ({ ...f, hours: e.target.value }))} className="h-8 text-sm" /></div>
            <div className="w-32"><Label className="text-xs">Date</Label><Input type="date" value={tForm.date} onChange={e => setTForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-sm" /></div>
            <Button size="sm" className="h-8" disabled={!tForm.hours} onClick={() => { logTime.mutate({ project_id: project.id, description: tForm.description || null, hours: Number(tForm.hours), date: tForm.date, is_billable: true }); setTForm(f => ({ ...f, description: '', hours: '' })); }}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
          {entries.length === 0 ? <p className="text-center py-6 text-sm text-muted-foreground">No time entries yet</p> : (
            <div className="space-y-1">
              {entries.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border text-sm">
                  <span className="text-muted-foreground w-20">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <span className="flex-1 truncate">{e.description || '—'}</span>
                  <span className="font-medium tabular-nums">{Number(e.hours).toFixed(1)}h</span>
                  {e.is_billable && <span className="text-xs text-success">{formatINR(Number(e.hours) * Number(project.hourly_rate))}</span>}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteEntry.mutate(e.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProjectsPage() {
  const { projects, isLoading, createProject, deleteProject } = useProjects();
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
