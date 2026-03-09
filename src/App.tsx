import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModuleRoute } from "@/components/auth/ModuleRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";

// Auth pages — lazy loaded (most users land authenticated)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// All app pages — lazy loaded
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const InvoiceEditor = lazy(() => import("./pages/InvoiceEditor"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const PublicInvoicePage = lazy(() => import("./pages/PublicInvoicePage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const QuickBillPage = lazy(() => import("./pages/QuickBillPage"));
const QuotationsPage = lazy(() => import("./pages/QuotationsPage"));
const QuotationEditor = lazy(() => import("./pages/QuotationEditor"));
const DeliveryChallansPage = lazy(() => import("./pages/DeliveryChallansPage"));
const ChallanEditor = lazy(() => import("./pages/ChallanEditor"));
const PurchaseOrdersPage = lazy(() => import("./pages/PurchaseOrdersPage"));
const PurchaseOrderEditor = lazy(() => import("./pages/PurchaseOrderEditor"));
const RecurringInvoicesPage = lazy(() => import("./pages/RecurringInvoicesPage"));
const PurchaseBillsPage = lazy(() => import("./pages/PurchaseBillsPage"));
const PurchaseBillEditor = lazy(() => import("./pages/PurchaseBillEditor"));
const BulkImportExportPage = lazy(() => import("./pages/BulkImportExportPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const AIChatbot = lazy(() => import("./components/chat/AIChatbot").then(m => ({ default: m.AIChatbot })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/invoice/view" element={<PublicInvoicePage />} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              
              {/* Protected routes */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<InvoiceEditor />} />
                <Route path="/invoices/:id" element={<InvoiceEditor />} />
                <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
                <Route path="/quick-bill" element={<ModuleRoute><QuickBillPage /></ModuleRoute>} />
                <Route path="/quotations" element={<ModuleRoute><QuotationsPage /></ModuleRoute>} />
                <Route path="/quotations/new" element={<ModuleRoute><QuotationEditor /></ModuleRoute>} />
                <Route path="/quotations/:id" element={<ModuleRoute><QuotationEditor /></ModuleRoute>} />
                <Route path="/quotations/:id/edit" element={<ModuleRoute><QuotationEditor /></ModuleRoute>} />
                <Route path="/challans" element={<ModuleRoute><DeliveryChallansPage /></ModuleRoute>} />
                <Route path="/challans/new" element={<ModuleRoute><ChallanEditor /></ModuleRoute>} />
                <Route path="/challans/:id" element={<ModuleRoute><ChallanEditor /></ModuleRoute>} />
                <Route path="/challans/:id/edit" element={<ModuleRoute><ChallanEditor /></ModuleRoute>} />
                <Route path="/purchase-orders" element={<ModuleRoute><PurchaseOrdersPage /></ModuleRoute>} />
                <Route path="/purchase-orders/new" element={<ModuleRoute><PurchaseOrderEditor /></ModuleRoute>} />
                <Route path="/purchase-orders/:id" element={<ModuleRoute><PurchaseOrderEditor /></ModuleRoute>} />
                <Route path="/purchase-orders/:id/edit" element={<ModuleRoute><PurchaseOrderEditor /></ModuleRoute>} />
                <Route path="/recurring" element={<ModuleRoute><RecurringInvoicesPage /></ModuleRoute>} />
                <Route path="/purchase-bills" element={<ModuleRoute><PurchaseBillsPage /></ModuleRoute>} />
                <Route path="/purchase-bills/new" element={<ModuleRoute><PurchaseBillEditor /></ModuleRoute>} />
                <Route path="/purchase-bills/:id" element={<ModuleRoute><PurchaseBillEditor /></ModuleRoute>} />
                <Route path="/purchase-bills/:id/edit" element={<ModuleRoute><PurchaseBillEditor /></ModuleRoute>} />
                <Route path="/recurring/new" element={<ModuleRoute><RecurringInvoicesPage /></ModuleRoute>} />
                <Route path="/recurring/:id" element={<ModuleRoute><RecurringInvoicesPage /></ModuleRoute>} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/reports" element={<ModuleRoute><ReportsPage /></ModuleRoute>} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/bulk" element={<BulkImportExportPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users/:profileId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <AIChatbot />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
