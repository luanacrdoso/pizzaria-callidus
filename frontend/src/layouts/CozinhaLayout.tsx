import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';

export function CozinhaLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar-equipe">
        <h2>🍳 Cozinha</h2>
        <NavLink to="/equipe/cozinha" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`} end>Fila de Pedidos</NavLink>
        <NavLink to="/equipe/perfil" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = '/equipe/login'; }} className="sidebar-sair">Sair</button>
      </aside>
      <main className="conteudo-equipe" style={{ padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}