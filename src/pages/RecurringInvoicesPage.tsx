import { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Play,
  Pause,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useRecurringTemplates } from '@/hooks/useRecurringTemplates';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function RecurringInvoicesPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const { templates, isLoading, updateTemplate, deleteTemplate, generateInvoice, isGenerating } =
    useRecurringTemplates();

  const [searchQuery, setSearchQuery] = useState('');

  usePageShortcuts(
    useMemo(
      () => [
        { key: '/', handler: () => searchRef.current?.focus() },
        { key: 'a', handler: () => navigate('/recurring/new') },
      ],
      [navigate]
    )
  );

  const filteredTemplates = templates.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.template_name.toLowerCase().includes(q) ||
      t.client?.name?.toLowerCase().includes(q)
    );
  });

  const activeCount = templates.filter((t) => t.is_active).length;
  const totalMonthly = templates
    .filter((t) => t.is_active)
    .reduce((sum, t) => {
      let multiplier = 1;
      if (t.frequency === 'weekly') multiplier = 4;
      if (t.frequency === 'quarterly') multiplier = 1 / 3;
      if (t.frequency === 'yearly') multiplier = 1 / 12;
      return sum + Number(t.grand_total) * multiplier;
    }, 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Recurring Invoices</h1>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link to="/recurring/new">
            <Plus className="w-3.5 h-3.5" />
            New Template
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatINR(totalMonthly)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={searchRef}
          type="search"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No recurring templates yet</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/recurring/new">Create your first template</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'transition-colors',
                template.is_active ? 'hover:border-primary/30' : 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{template.template_name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          template.is_active ? 'border-green-500 text-green-600' : ''
                        )}
                      >
                        {frequencyLabels[template.frequency] || template.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.client?.name || 'No client'} • Next:{' '}
                      {format(new Date(template.next_generate_date), 'dd MMM yyyy')}
                      <span className="text-xs ml-1 hidden sm:inline">
                        ({formatDistanceToNow(new Date(template.next_generate_date), { addSuffix: true })})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-bold">{formatINR(Number(template.grand_total))}</p>
                      <p className="text-xs text-muted-foreground">per cycle</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) =>
                          updateTemplate.mutate({ id: template.id, is_active: checked })
                        }
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/recurring/${template.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/recurring/${template.id}/edit`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => generateInvoice.mutate(template.id)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            Generate Now
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteTemplate.mutate(template.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
