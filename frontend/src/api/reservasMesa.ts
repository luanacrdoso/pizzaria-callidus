export interface ReservaMesa {
  id: number;
  nome_cliente: string;
  telefone_cliente: string | null;
  data_reserva: string;
  horario_reserva: string | null;
  quantidade_pessoas: number | null;
  mesa_id: number | null;
  observacoes: string | null;
  status: 'ativa' | 'concluida' | 'cancelada';
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarReservasMesa(): Promise<ReservaMesa[]> {
  const resposta = await fetch(`${API_URL}/reservas-mesa`);
  if (!resposta.ok) throw new Error('Erro ao buscar reservas de mesa.');
  return resposta.json();
}

export async function criarReservaMesa(dados: {
  nome_cliente: string;
  telefone_cliente: string;
  data_reserva: string;
  horario_reserva: string;
  quantidade_pessoas: number | null;
  observacoes: string;
}): Promise<ReservaMesa> {
  const resposta = await fetch(`${API_URL}/reservas-mesa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Erro ao criar reserva de mesa.');
  return resposta.json();
}

export async function atualizarReservaMesa(id: number, dados: { status?: string; mesa_id?: number | null }): Promise<ReservaMesa> {
  const resposta = await fetch(`${API_URL}/reservas-mesa/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar reserva de mesa.');
  return resposta.json();
}