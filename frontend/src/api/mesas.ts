export interface Mesa {
  id: number;
  numero: number;
  nome: string | null;
  capacidade: number;
  status: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarMesas(): Promise<Mesa[]> {
  const resposta = await fetch(`${API_URL}/mesas`);
  if (!resposta.ok) throw new Error('Erro ao buscar mesas.');
  return resposta.json();
}

export async function criarMesa(dados: { numero: number; capacidade: number }): Promise<Mesa> {
  const resposta = await fetch(`${API_URL}/mesas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Erro ao criar mesa.');
  return resposta.json();
}

export async function editarMesa(mesa: Mesa): Promise<Mesa> {
  const resposta = await fetch(`${API_URL}/mesas/${mesa.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capacidade: mesa.capacidade, status: mesa.status, nome: mesa.nome })
  });
  if (!resposta.ok) throw new Error('Erro ao editar mesa.');
  return resposta.json();
}

export async function excluirMesa(id: number): Promise<void> {
  const resposta = await fetch(`${API_URL}/mesas/${id}`, { method: 'DELETE' });
  if (!resposta.ok) throw new Error('Erro ao excluir mesa.');
}