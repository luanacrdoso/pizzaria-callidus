import { fetchAutenticado } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarPedidosAdmin(periodo: string, ano?: string) {
  const params = new URLSearchParams();
  if (ano) params.set('ano', ano); else params.set('periodo', periodo);
  const r = await fetchAutenticado(`${API_URL}/pedidos?${params.toString()}`);
  if (!r.ok) throw new Error('Erro ao buscar pedidos.');
  return r.json();
}

export async function buscarDashboardAdmin(periodo: string) {
  const r = await fetchAutenticado(`${API_URL}/dashboard/admin?periodo=${periodo}`);
  if (!r.ok) throw new Error('Erro ao buscar dashboard.');
  return r.json();
}