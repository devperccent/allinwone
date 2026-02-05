import { BarChart3, FileText, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR } from '@/hooks/useInvoiceCalculations';

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your business performance and generate reports
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Sales Report</CardTitle>
                <CardDescription>Revenue and sales analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-semibold">{formatINR(52600)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Month</span>
                <span className="font-semibold">{formatINR(46800)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Growth</span>
                <span className="font-semibold text-success">+12.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">GST Summary</CardTitle>
                <CardDescription>Tax collected and payable</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST Collected</span>
                <span className="font-semibold">{formatINR(4050)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST Collected</span>
                <span className="font-semibold">{formatINR(4050)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGST Collected</span>
                <span className="font-semibold">{formatINR(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg">Outstanding</CardTitle>
                <CardDescription>Pending payments</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Outstanding</span>
                <span className="font-semibold text-warning">{formatINR(62200)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-destructive">{formatINR(17200)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due This Week</span>
                <span className="font-semibold">{formatINR(45000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Chart Area */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend over the last 6 months</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Charts will be available once you have more data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
