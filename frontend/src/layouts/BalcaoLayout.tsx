import { useEffect, useState, type CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';

const API_URL = import.meta.env.VITE_API_URL;

export function BalcaoLayout() {
  const [config, setConfig] = useState<any>(null);
  useEffect(() => { fetch(`${API_URL}/config`).then((r) => r.json()).then(setConfig); }, []);

  const modoEscuro = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const temaStyle: CSSProperties = config ? {
    ['--color-primary' as string]: modoEscuro ? config.cor_primaria_escura : config.cor_primaria_clara,
    ['--color-secondary' as string]: modoEscuro ? config.cor_secundaria_escura : config.cor_secundaria_clara,
  } : {};

  return (
    <div className="layout-master" style={{ ...temaStyle, display: 'flex' }}>
      <nav className="sidebar-equipe">
        <h2>Balcão</h2>
        <NavLink to="/equipe/balcao/mesas" className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>Mesas</NavLink>
        <NavLink to="/equipe/balcao/reservas" className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>Reservas</NavLink>
        <NavLink to="/equipe/balcao/pedido-presencial" className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>Anotar Pedido</NavLink>
        <NavLink to="/equipe/balcao/retirada" className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>Retirada</NavLink>
        <NavLink to="/equipe/balcao/ativos" className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>Pedidos Ativos</NavLink>
        <NavLink to="/equipe/perfil" className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = '/equipe/login'; }} className="sidebar-sair">Sair</button>
      </nav>
      <div className="conteudo-equipe"><Outlet /></div>
    </div>
  );
}