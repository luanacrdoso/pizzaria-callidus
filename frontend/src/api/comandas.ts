import { fetchComoFuncionario } from './funcionarioAuth';

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarComandas(mesaId: number) {
  const r = await fetchComoFuncionario(`${API_URL}/comandas?mesa_id=${mesaId}`);

  if (!r.ok) throw new Error('Erro ao buscar comandas.');

  return r.json();
}

export async function adicionarItemAoPedido(
  pedidoId: number,
  item: {
    nome: string;
    tamanho: string;
    extras: string[];
    observacoes?: string | null;
    quantidade: number;
    precoUnitario: number;
    pizzaId?: number | null;
  }
) {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/${pedidoId}/itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({
      nome: item.nome,
      tamanho: item.tamanho,
      extras: item.extras,
      observacoes: item.observacoes,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
      pizza_id: item.pizzaId,
    })
  });

  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.mensagem);
  }

  return r.json();
}

export async function registrarPagamento(
  pedidoId: number,
  dados: {
    nome_pagador: string;
    valor_pago: number;
    forma_pagamento: string;
  }
) {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/${pedidoId}/pagamentos`, {
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