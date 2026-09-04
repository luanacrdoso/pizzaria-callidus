export interface Adicional {
  id: number;
  nome: string;
  preco: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarAdicionais(): Promise<Adicional[]> {
  const resposta = await fetch(`${API_URL}/adicionais`);
  if (!resposta.ok) throw new Error('Erro ao buscar adicionais.');
  return resposta.json();
}

export async function criarAdicional(dados: { nome: string; preco: number }): Promise<Adicional> {
  const resposta = await fetch(`${API_URL}/adicionais`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Erro ao criar adicional.');
  return resposta.json();
}

export async function excluirAdicional(id: number): Promise<void> {
  const resposta = await fetch(`${API_URL}/adicionais/${id}`, { method: 'DELETE' });
  if (!resposta.ok) throw new Error('Erro ao excluir adicional.');
}