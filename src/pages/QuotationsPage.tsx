import { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowRightCircle,
  Loader2,
  Send,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { useQuotations } from '@/hooks/useQuotations';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  converted: { label: 'Converted', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export default function QuotationsPage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const { quotations, isLoading, convertToInvoice, deleteQuotation, updateQuotation, isConverting } = useQuotations();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  usePageShortcuts(useMemo(() => [
    { key: '/', handler: () => searchRef.current?.focus() },
    { key: 'a', handler: () => navigate('/quotations/new') },
  ], [navigate]));

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Quotations & Estimates</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Create quotes and convert them to invoices
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/quotations/new">
            <Plus className="w-4 h-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search by quotation # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No quotations found</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/quotations/new">Create your first quotation</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                       <Link
                         to={`/quotations/${quotation.id}`}
                         className="font-semibold text-primary hover:underline"
                       >
                         {quotation.quotation_number}
                       </Link>
                       <Badge className={cn('text-xs', statusConfig[quotation.status]?.className)}>
                         {statusConfig[quotation.status]?.label || quotation.status}
                       </Badge>
                     </div>
                     <p className="text-sm text-muted-foreground mt-1 truncate">
                       {quotation.client?.name || 'No client'} • {quotation.date_issued}
                       {quotation.valid_until && ` • Valid till ${quotation.valid_until}`}
                     </p>
                   </div>
                   <div className="flex items-center justify-between sm:justify-end gap-2">
                     <p className="font-bold">{formatINR(Number(quotation.grand_total))}</p>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/quotations/${quotation.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      {quotation.status !== 'converted' && (
                        <DropdownMenuItem asChild>
                          <Link to={`/quotations/${quotation.id}/edit`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {quotation.status === 'draft' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateQuotation.mutate({ id: quotation.id, status: 'sent' })}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Mark as Sent
                          </DropdownMenuItem>
                        </>
                      )}
                      {(quotation.status === 'sent' || quotation.status === 'accepted') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => convertToInvoice.mutate(quotation.id)}
                            disabled={isConverting}
                          >
                            {isConverting ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <ArrowRightCircle className="w-4 h-4 mr-2" />
                            )}
                            Convert to Invoice
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteQuotation.mutate(quotation.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
