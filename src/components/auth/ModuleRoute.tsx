import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { toast } from 'sonner';

interface ModuleRouteProps {
  children: React.ReactNode;
}

export function ModuleRoute({ children }: ModuleRouteProps) {
  const location = useLocation();
  const { isRouteEnabled } = useEnabledModules();
  const toastShown = useRef(false);

  const enabled = isRouteEnabled(location.pathname);

  useEffect(() => {
    if (!enabled && !toastShown.current) {
      toastShown.current = true;
      toast.info('This feature is not enabled for your account. You can enable it in Settings → Modules.');
    }
  }, [enabled]);

  if (!enabled) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
