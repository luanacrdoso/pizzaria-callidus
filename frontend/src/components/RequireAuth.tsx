import { Navigate } from 'react-router-dom';
import { obterToken } from '../api/auth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = obterToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}