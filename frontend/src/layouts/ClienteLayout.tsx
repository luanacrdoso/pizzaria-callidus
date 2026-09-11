import { Link, Outlet } from 'react-router-dom';
import { obterTokenCliente, logoutCliente } from '../api/clienteAuth';

export function ClienteLayout() {
  const logado = !!obterTokenCliente();

  return (
    <div className="layout-master">
      <header className="loja-navbar">
        <div className="loja-nav-brand">
          <span style={{ fontSize: '1.6rem' }}>🍕</span>
          <span className="loja-nav-name">Pizzaria</span>
        </div>

        <nav className="loja-nav-links">
          <Link to="/" className="loja-link-item">Cardápio</Link>
          <Link to="/reservar" className="loja-link-item">Reservar</Link>
          
          {logado ? (
            <>
              <Link to="/perfil" className="loja-link-item">Meu Perfil</Link>
              <Link to="/meus-pedidos" className="loja-link-item">Meus Pedidos</Link>
              <button 
                onClick={() => { logoutCliente(); window.location.href = "/"; }}
                className="sidebar-sair"
                style={{ padding: '6px 14px' }}
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="loja-link-item">Entrar / Cadastrar 👤</Link>
          )}

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