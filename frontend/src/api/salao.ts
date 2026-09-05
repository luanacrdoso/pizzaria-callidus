export interface SalaoConfig {
  id: number;
  nome: string | null;
  descricao: string | null;
  capacidade_pessoas: number | null;
  imagem_url: string | null;
  ativo: boolean;
}

export interface Reserva {
  id: number;
  nome_cliente: string;
  telefone_cliente: string | null;
  data_evento: string;
  horario_evento: string | null;
  quantidade_convidados: number | null;
  valor_combinado: string | null;
  observacoes: string | null;
  status: 'ativa' | 'concluida' | 'cancelada';
  criado_em: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarSalao(): Promise<SalaoConfig> {
  const resposta = await fetch(`${API_URL}/salao`);
  if (!resposta.ok) throw new Error('Erro ao buscar salão de eventos.');
  return resposta.json();
}

export async function atualizarSalao(config: SalaoConfig): Promise<SalaoConfig> {
  const resposta = await fetch(`${API_URL}/salao`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar salão de eventos.');
  return resposta.json();
}

export async function buscarReservas(status?: string): Promise<Reserva[]> {
  const url = status ? `${API_URL}/reservas-salao?status=${status}` : `${API_URL}/reservas-salao`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error('Erro ao buscar reservas.');
  return resposta.json();
}

export async function criarReserva(dados: {
  nome_cliente: string;
  telefone_cliente: string;
  data_evento: string;
  horario_evento: string;
  quantidade_convidados: number | null;
  valor_combinado: number | null;
  observacoes: string;
}): Promise<Reserva> {
  const resposta = await fetch(`${API_URL}/reservas-salao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Erro ao criar reserva.');
  return resposta.json();
}

export async function atualizarStatusReserva(id: number, status: string): Promise<Reserva> {
  const resposta = await fetch(`${API_URL}/reservas-salao/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar reserva.');
  return resposta.json();
}