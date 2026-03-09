import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAllTimeEntries } from '@/hooks/useProjects';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import type { Project } from '@/hooks/useProjects';

interface WeeklyTimesheetProps {
  projects: Project[];
}

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyTimesheet({ projects }: WeeklyTimesheetProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { entries, isLoading } = useAllTimeEntries();

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  // Filter entries to this week
  const weekEntries = useMemo(() => {
    return entries.filter(e => e.date >= weekStart && e.date <= weekEnd);
  }, [entries, weekStart, weekEnd]);

  // Build project → day → hours map
  const projectMap = useMemo(() => {
    const map = new Map<string, { name: string; rate: number; days: Record<string, number> }>();
    
    for (const entry of weekEntries) {
      if (!map.has(entry.project_id)) {
        const proj = projects.find(p => p.id === entry.project_id);
        map.set(entry.project_id, {
          name: proj?.name || 'Unknown',
          rate: Number(proj?.hourly_rate || 0),
          days: {},
        });
      }
      const row = map.get(entry.project_id)!;
      row.days[entry.date] = (row.days[entry.date] || 0) + Number(entry.hours);
    }
    return map;
  }, [weekEntries, projects]);

  // Day totals
  const dayTotals = useMemo(() => {
    return weekDates.map(d => {
      const dateStr = formatDate(d);
      let total = 0;
      projectMap.forEach(row => { total += row.days[dateStr] || 0; });
      return total;
    });
  }, [weekDates, projectMap]);

  const weekTotal = dayTotals.reduce((s, h) => s + h, 0);

  const totalEarnings = useMemo(() => {
    let sum = 0;
    projectMap.forEach(row => {
      const hrs = Object.values(row.days).reduce((s, h) => s + h, 0);
      sum += hrs * row.rate;
    });
    return sum;
  }, [projectMap]);

  const exportCSV = () => {
    const headers = ['Project', ...weekDates.map(d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })), 'Total', 'Earnings'];
    const rows: string[][] = [];

    projectMap.forEach((row) => {
      const dayHours = weekDates.map(d => (row.days[formatDate(d)] || 0).toFixed(2));
      const rowTotal = weekDates.reduce((s, d) => s + (row.days[formatDate(d)] || 0), 0);
      rows.push([`"${row.name}"`, ...dayHours, rowTotal.toFixed(2), (rowTotal * row.rate).toFixed(2)]);
    });

    rows.push(['Total', ...dayTotals.map(h => h.toFixed(2)), weekTotal.toFixed(2), totalEarnings.toFixed(2)]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${weekStart}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {weekDates[0].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {weekDates[6].toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {isCurrentWeek && <Badge variant="secondary" className="text-[10px] h-5">This Week</Badge>}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setWeekOffset(0)}>Today</Button>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Hours</p><p className="text-xl font-bold tabular-nums">{weekTotal.toFixed(1)}h</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Avg/Day</p><p className="text-xl font-bold tabular-nums">{(weekTotal / 7).toFixed(1)}h</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Earnings</p><p className="text-xl font-bold tabular-nums">{formatINR(totalEarnings)}</p></CardContent></Card>
      </div>

      {/* Timesheet Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Project</TableHead>
                  {weekDates.map((d, i) => (
                    <TableHead key={i} className="text-center min-w-[60px]">
                      <div className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</div>
                      <div className="text-xs">{d.getDate()}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectMap.size === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                      No time entries this week
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {Array.from(projectMap.entries()).map(([pid, row]) => {
                      const rowTotal = weekDates.reduce((s, d) => s + (row.days[formatDate(d)] || 0), 0);
                      return (
                        <TableRow key={pid}>
                          <TableCell className="font-medium text-sm">{row.name}</TableCell>
                          {weekDates.map((d, i) => {
                            const hrs = row.days[formatDate(d)] || 0;
                            return (
                              <TableCell key={i} className="text-center tabular-nums text-sm">
                                {hrs > 0 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-primary/10 text-primary text-xs font-medium">
                                    {hrs.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold tabular-nums text-sm">{rowTotal.toFixed(1)}h</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell className="text-sm">Total</TableCell>
                      {dayTotals.map((h, i) => (
                        <TableCell key={i} className="text-center tabular-nums text-sm">
                          {h > 0 ? `${h.toFixed(1)}` : '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-center tabular-nums text-sm text-primary">{weekTotal.toFixed(1)}h</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
