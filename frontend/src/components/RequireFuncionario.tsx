import { Navigate } from 'react-router-dom';
import { obterTokenFuncionario, obterCargoFuncionario } from '../api/funcionarioAuth';

export function RequireFuncionario({ cargos, children }: { cargos?: string[]; children: React.ReactNode }) {
  const token = obterTokenFuncionario();
  if (!token) return <Navigate to="/equipe/login" replace />;

  const cargo = obterCargoFuncionario();
  if (cargos && cargo && !cargos.includes(cargo)) {
    return <Navigate to="/equipe" replace />;
  }
  return <>{children}</>;
}