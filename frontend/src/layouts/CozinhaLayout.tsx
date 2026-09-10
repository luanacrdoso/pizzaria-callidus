import { Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';
 
export function CozinhaLayout() {
  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #ddd" }}>
        <h2 style={{ margin: 0 }}>Cozinha</h2>
        <button onClick={() => { logoutFuncionario(); window.location.href = "/equipe/login"; }}>Sair</button>
      </header>
      <Outlet />
    </div>
  );
}
