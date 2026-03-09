import { useState } from 'react';
import { Plus, Trash2, Receipt, Calendar, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExpenses, EXPENSE_CATEGORIES, PAYMENT_MODES } from '@/hooks/useExpenses';
import { formatINR } from '@/hooks/useInvoiceCalculations';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function ExpensesPage() {
  const { expenses, monthlyTotals, isLoading, createExpense, deleteExpense } = useExpenses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    category: 'miscellaneous',
    description: '',
    payment_mode: 'cash',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    await createExpense.mutateAsync({
      amount: Number(form.amount),
      category: form.category,
      description: form.description || null,
      payment_mode: form.payment_mode,
      expense_date: form.expense_date,
      receipt_url: null,
    });
    setForm({ amount: '', category: 'miscellaneous', description: '', payment_mode: 'cash', expense_date: new Date().toISOString().split('T')[0] });
    setOpen(false);
  };

  const getCategoryInfo = (cat: string) => EXPENSE_CATEGORIES.find(c => c.value === cat) || { label: cat, emoji: '📋' };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Expenses</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-9 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg">Quick Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Amount - Big and prominent */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="text-2xl font-bold h-14 text-center"
                  autoFocus
                />
              </div>

              {/* Category grid */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Category</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg text-xs transition-colors ${
                        form.category === cat.value
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="truncate w-full text-center text-[10px]">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment mode */}
              <div className="flex gap-2">
                {PAYMENT_MODES.map(pm => (
                  <button
                    key={pm.value}
                    onClick={() => setForm(f => ({ ...f, payment_mode: pm.value }))}
                    className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-xs transition-colors ${
                      form.payment_mode === pm.value
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <span>{pm.emoji}</span>
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>

              {/* Description */}
              <Input
                placeholder="What was this for? (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />

              {/* Date */}
              <Input
                type="date"
                value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
              />

              <Button onClick={handleSubmit} className="w-full h-11" disabled={createExpense.isPending}>
                {createExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold mt-1">{formatINR(monthlyTotals.total)}</p>
          </CardContent>
        </Card>
        {Object.entries(monthlyTotals.byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, amt]) => {
            const info = getCategoryInfo(cat);
            return (
              <Card key={cat}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{info.emoji} {info.label}</p>
                  <p className="text-lg font-semibold mt-1">{formatINR(amt)}</p>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Expense list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No expenses yet. Add your first one!</p>
            </div>
          ) : (
            <div className="divide-y">
              {expenses.map(exp => {
                const info = getCategoryInfo(exp.category);
                return (
                  <div key={exp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-xl">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {exp.description || info.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' · '}
                        {PAYMENT_MODES.find(p => p.value === exp.payment_mode)?.label || exp.payment_mode}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-destructive">
                      -{formatINR(Number(exp.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteExpense.mutate(exp.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
