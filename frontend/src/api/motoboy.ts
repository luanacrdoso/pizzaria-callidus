import { fetchComoFuncionario } from './funcionarioAuth';
 
const API_URL = import.meta.env.VITE_API_URL;
 
export async function buscarEntregasDisponiveis() {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/entregas-disponiveis`);
  if (!r.ok) throw new Error('Erro ao buscar entregas.');
  return r.json();
}
 
export async function assumirEntrega(id: number) {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/${id}/assumir-entrega`, { method: "PUT" });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); }
  return r.json();
}
 
export async function buscarMinhasEntregas() {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/minhas-entregas`);
  if (!r.ok) throw new Error('Erro ao buscar minhas entregas.');
  return r.json();
}
 
export async function atualizarStatusEntrega(id: number, status: string) {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/${id}/status`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); }
  return r.json();
}
