import { Link, Outlet } from 'react-router-dom';
import { obterTokenCliente, logoutCliente } from '../api/clienteAuth';

export function ClienteLayout() {
  const logado = !!obterTokenCliente();

  return (
    <div>
      <header style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ddd" }}>
        <Link to="/">Cardápio</Link>
        <Link to="/carrinho">Carrinho</Link>
        <Link to="/reservar">Reservar</Link>
        {logado ? (
          <>
            <Link to="/perfil">Meu Perfil</Link>
            <Link to="/meus-pedidos">Meus Pedidos</Link>
            <button onClick={() => { logoutCliente(); window.location.href = "/"; }}>Sair</button>
          </>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </header>
      <Outlet />
    </div>
  );
}