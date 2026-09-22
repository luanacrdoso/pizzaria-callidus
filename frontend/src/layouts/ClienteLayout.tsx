import { Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { obterTokenCliente, logoutCliente } from '../api/clienteAuth';
import { buscarConfig } from '../api/config';
import { useTema } from '../../hooks/useTema';

export function ClienteLayout() {
  const logado = !!obterTokenCliente();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: buscarConfig,
  });

  const { modo, setModo } = useTema(config);

  return (
    <div className="layout-master">
      <header className="loja-navbar">
        <div className="loja-nav-brand">
          <span style={{ fontSize: '1.6rem' }}>🍕</span>
          <span className="loja-nav-name">Pizzaria</span>
        </div>

        <nav className="loja-nav-links">
          <Link to="/" className="loja-link-item">
            Cardápio
          </Link>

          <Link to="/reservar" className="loja-link-item">
            Reservar
          </Link>
          
          {logado ? (
            <>
              <Link to="/perfil" className="loja-link-item">
                Meu Perfil
              </Link>

              <Link to="/meus-pedidos" className="loja-link-item">
                Meus Pedidos
              </Link>

              <button 
                onClick={() => {
                  logoutCliente();
                  window.location.href = "/";
                }}
                className="sidebar-sair"
                style={{ padding: '6px 14px' }}
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="loja-link-item">
              Entrar / Cadastrar 👤
            </Link>
          )}

          <button
            type="button"
            onClick={() =>
              setModo(modo === 'claro' ? 'escuro' : 'claro')
            }
            className="loja-link-item"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            title={
              modo === 'claro'
                ? 'Ativar modo escuro'
                : 'Ativar modo claro'
            }
          >
            {modo === 'claro' ? '🌙' : '☀️'}
          </button>

          <Link to="/carrinho" className="btn-carrinho-nav">
            🛒 Carrinho
          </Link>
        </nav>
      </header>

      <main className="layout-content">
        <Outlet />
      </main>

      <footer className="loja-footer">
        <div className="footer-copyright">
          © {new Date().getFullYear()} Pizzaria — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}