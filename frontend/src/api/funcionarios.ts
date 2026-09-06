import { fetchAutenticado } from './auth';

export interface Funcionario {
  id: number;
  username: string;
  nome: string;
  telefone: string | null;
  cargo: string;
  aprovado: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarFuncionarios(): Promise<Funcionario[]> {
  const resposta = await fetchAutenticado(`${API_URL}/funcionarios`);
  if (!resposta.ok) throw new Error('Erro ao buscar funcionários.');
  return resposta.json();
}

export async function aprovarFuncionario(id: number): Promise<Funcionario> {
  const resposta = await fetchAutenticado(`${API_URL}/funcionarios/${id}/aprovar`, { method: 'PUT' });
  if (!resposta.ok) throw new Error('Erro ao aprovar funcionário.');
  return resposta.json();
}

export async function excluirFuncionario(id: number): Promise<void> {
  const resposta = await fetchAutenticado(`${API_URL}/funcionarios/${id}`, { method: 'DELETE' });
  if (!resposta.ok) throw new Error('Erro ao excluir funcionário.');
}