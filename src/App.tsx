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
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import Dashboard from "./pages/Dashboard";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceEditor from "./pages/InvoiceEditor";
import ProductsPage from "./pages/ProductsPage";
import ClientsPage from "./pages/ClientsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import PublicInvoicePage from "./pages/PublicInvoicePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import HelpPage from "./pages/HelpPage";
import QuickBillPage from "./pages/QuickBillPage";
import QuotationsPage from "./pages/QuotationsPage";
import QuotationEditor from "./pages/QuotationEditor";
import DeliveryChallansPage from "./pages/DeliveryChallansPage";
import ChallanEditor from "./pages/ChallanEditor";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import PurchaseOrderEditor from "./pages/PurchaseOrderEditor";
import RecurringInvoicesPage from "./pages/RecurringInvoicesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              <Route path="/recurring/new" element={<ModuleRoute><RecurringInvoicesPage /></ModuleRoute>} />
              <Route path="/recurring/:id" element={<ModuleRoute><RecurringInvoicesPage /></ModuleRoute>} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users/:profileId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
