const API_URL = import.meta.env.VITE_API_URL;

function headerAutenticacao(): HeadersInit {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('equipe_token');
  return { Authorization: `Bearer ${token}` };
}

export async function buscarPedidosAtivos() {
  const r = await fetch(`${API_URL}/pedidos/ativos`, { headers: headerAutenticacao() });
  if (!r.ok) throw new Error('Erro ao buscar pedidos ativos.');
  return r.json();
}