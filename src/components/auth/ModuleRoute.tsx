import { Navigate, useLocation } from 'react-router-dom';
import { useEnabledModules } from '@/hooks/useEnabledModules';

interface ModuleRouteProps {
  children: React.ReactNode;
}

export function ModuleRoute({ children }: ModuleRouteProps) {
  const location = useLocation();
  const { isRouteEnabled } = useEnabledModules();

  if (!isRouteEnabled(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
