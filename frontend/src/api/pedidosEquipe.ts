import { fetchComoFuncionario } from './funcionarioAuth';

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarPedidosRetirada() {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/retirada`);
  if (!r.ok) throw new Error('Erro ao buscar pedidos de retirada.');
  return r.json();
}

export async function buscarFilaCozinha() {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/cozinha`);
  if (!r.ok) throw new Error('Erro ao buscar fila da cozinha.');
  return r.json();
}

export async function atualizarStatusPedido(id: number, status: string) {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.mensagem);
  }
  return r.json();
}

export async function criarPedidoPresencial(dados: any) {
  const r = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.mensagem);
  }
  return r.json();
}