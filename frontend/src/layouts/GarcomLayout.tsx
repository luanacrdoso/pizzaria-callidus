import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';

export function GarcomLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar-equipe">
        <h2>🧑‍🍳 Garçom</h2>
        <NavLink to="/equipe/garcom/comandas" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Comandas Ativas</NavLink>
        <NavLink to="/equipe/garcom/montar" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Montar Comanda</NavLink>
        <NavLink to="/equipe/garcom/servir" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Servir Pedidos</NavLink>
        <NavLink to="/equipe/garcom/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Meus Ganhos</NavLink>
        <NavLink to="/equipe/garcom/perfil" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = '/equipe/login'; }} className="sidebar-sair">Sair</button>
      </aside>
      <main className="conteudo-equipe" style={{ padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}