import { Navigate } from 'react-router-dom';
import { obterCargoFuncionario, obterTokenFuncionario } from '../api/funcionarioAuth';
 
export function EquipeHomePage() {
  if (!obterTokenFuncionario()) return <Navigate to="/equipe/login" replace />;
  const cargo = obterCargoFuncionario();
 
  if (cargo === 'balcao') return <Navigate to="/equipe/balcao" replace />;
  if (cargo === 'cozinha') return <Navigate to="/equipe/cozinha" replace />;
 
  return (
    <div style={{ padding: 24 }}>
      <h1>Área da Equipe</h1>
      <p>Logado como: <strong>{cargo}</strong></p>
      <p style={{ color: "#888" }}>Ainda não existe uma tela específica para esse cargo.</p>
    </div>
  );
}
