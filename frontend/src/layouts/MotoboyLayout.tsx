import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';

export function MotoboyLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar-equipe">
        <h2>🛵 Motoboy</h2>
        <NavLink to="/equipe/motoboy/disponiveis" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Disponíveis</NavLink>
        <NavLink to="/equipe/motoboy/minhas-entregas" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Minhas Entregas</NavLink>
        <NavLink to="/equipe/motoboy/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Meus Ganhos</NavLink>
        <NavLink to="/equipe/perfil" className={({ isActive }) => `sidebar-link ${isActive ? 'ativo' : ''}`}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = '/equipe/login'; }} className="sidebar-sair">Sair</button>
      </aside>
      <main className="conteudo-equipe" style={{ padding: '32px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}