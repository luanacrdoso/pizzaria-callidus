import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { logout } from '../api/auth';
import { buscarConfig } from '../api/config';
import { useTema } from '../../hooks/useTema';

export function AdminLayout() {
  const navigate = useNavigate();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: buscarConfig,
  });

  const { modo, setModo } = useTema(config);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar-equipe">
        <h2>⚙️ Painel Admin</h2>
        
        <NavLink
          to="/admin/config"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Aparência
        </NavLink>

        <NavLink
          to="/admin/cardapio"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Cardápio
        </NavLink>

        <NavLink
          to="/admin/mesas"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Mesas
        </NavLink>

        <NavLink
          to="/admin/salao"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Salão de Eventos
        </NavLink>

        <NavLink
          to="/admin/reservas-mesa"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Reservas
        </NavLink>

        <NavLink
          to="/admin/cupons"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Cupons
        </NavLink>

        <NavLink
          to="/admin/funcionarios"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Funcionários
        </NavLink>

        <NavLink
          to="/admin/pagamentos-pendentes"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Pagamentos Pix
        </NavLink>

        <NavLink
          to="/admin/pedidos-ativos"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Pedidos Ativos
        </NavLink>

        <NavLink
          to="/admin/pedidos"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Histórico
        </NavLink>

        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'ativo' : ''}`
          }
        >
          Dashboard
        </NavLink>

        <button
          type="button"
          onClick={() =>
            setModo(modo === 'claro' ? 'escuro' : 'claro')
          }
          className="sidebar-link"
        >
          {modo === 'claro' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
        </button>
        
        <button onClick={handleLogout} className="sidebar-sair">
          Sair
        </button>
      </aside>

      <main
        className="conteudo-equipe"
        style={{ padding: '32px 24px' }}
      >
        <Outlet />
      </main>
    </div>
  );
}