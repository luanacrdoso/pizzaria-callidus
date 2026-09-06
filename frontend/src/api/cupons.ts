import { fetchAutenticado } from './auth';

export interface Cupom {
  id: number;
  codigo: string;
  tipo: 'percentual' | 'valor_fixo' | 'entrega_gratis';
  valor: string;
  ativo: boolean;
  validade_inicio: string | null;
  validade_fim: string | null;
  limite_usos: number | null;
  usos_atuais: number;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarCupons(): Promise<Cupom[]> {
  const resposta = await fetchAutenticado(`${API_URL}/cupons`);
  if (!resposta.ok) throw new Error('Erro ao buscar cupons.');
  return resposta.json();
}

export async function criarCupom(dados: {
  codigo: string;
  tipo: string;
  valor: number;
  validade_inicio: string | null;
  validade_fim: string | null;
  limite_usos: number | null;
}): Promise<Cupom> {
  const resposta = await fetchAutenticado(`${API_URL}/cupons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao criar cupom.');
  }
  return resposta.json();
}

export async function atualizarCupom(cupom: Cupom): Promise<Cupom> {
  const resposta = await fetchAutenticado(`${API_URL}/cupons/${cupom.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cupom)
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar cupom.');
  return resposta.json();
}

export async function excluirCupom(id: number): Promise<void> {
  const resposta = await fetchAutenticado(`${API_URL}/cupons/${id}`, { method: 'DELETE' });
  if (!resposta.ok) throw new Error('Erro ao excluir cupom.');
}