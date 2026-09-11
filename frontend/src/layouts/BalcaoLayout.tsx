import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';

export function BalcaoLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar-equipe">
        <h2>🛎️ Balcão</h2>
        <NavLink to="/equipe/balcao/mesas" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Mesas</NavLink>
        <NavLink to="/equipe/balcao/reservas" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Reservas</NavLink>
        <NavLink to="/equipe/balcao/pedido-presencial" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Anotar Pedido</NavLink>
        <NavLink to="/equipe/balcao/retirada" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Retirada</NavLink>
        <NavLink to="/equipe/balcao/ativos" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Pedidos Ativos</NavLink>
        <NavLink to="/equipe/balcao/perfil" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = '/equipe/login'; }} className="sidebar-sair">Sair</button>
      </aside>
      <main className="conteudo-equipe" style={{ padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}