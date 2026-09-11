const API_URL = import.meta.env.VITE_API_URL;

export async function buscarAvaliacao(pedidoId: number) {
  const r = await fetch(`${API_URL}/pedidos/${pedidoId}/avaliacao`);
  if (!r.ok) throw new Error('Erro ao buscar avaliação.');
  return r.json();
}

export async function enviarAvaliacao(pedidoId: number, nota: number, comentario: string) {
  const r = await fetch(`${API_URL}/pedidos/${pedidoId}/avaliacao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nota, comentario })
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); }
  return r.json();
}

export async function buscarMediaAvaliacoes() {
  const r = await fetch(`${API_URL}/avaliacoes/media`);
  return r.json();
}