import { obterCargoFuncionario, obterTokenFuncionario, logoutFuncionario } from '../api/funcionarioAuth';
import { Navigate } from 'react-router-dom';

export function EquipeHomePage() {
  if (!obterTokenFuncionario()) return <Navigate to="/equipe/login" replace />;
  const cargo = obterCargoFuncionario();

  return (
    <div style={{ padding: 24 }}>
      <h1>Área da Equipe</h1>
      <p>Logado como: <strong>{cargo}</strong></p>
      <p style={{ color: '#888' }}>
        As telas de {cargo === 'balcao' ? 'Balcão' : cargo === 'cozinha' ? 'Cozinha' : cargo} ainda serão construídas aqui.
      </p>
      <button onClick={() => { logoutFuncionario(); window.location.href = '/equipe/login'; }}>Sair</button>
    </div>
  );
}