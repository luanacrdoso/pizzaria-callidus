import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { obterPedidosLocais } from '../api/carrinho';
import { obterTokenCliente, fetchComoCliente } from '../api/clienteAuth';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarHistorico(): Promise<any[]> {
  if (obterTokenCliente()) {
    const r = await fetchComoCliente(`${API_URL}/pedidos/meus`);
    if (!r.ok) throw new Error('Erro ao buscar histórico.');
    return r.json();
  }

  // Sem login: busca cada pedido salvo localmente, um a um
  const ids = obterPedidosLocais();
  const pedidos = await Promise.all(
    ids.map((id) => fetch(`${API_URL}/pedidos/${id}`).then((r) => r.ok ? r.json() : null))
  );
  return pedidos.filter(Boolean);
}

const STATUS_EM_ANDAMENTO = ['aguardando_pagamento', 'recebido', 'preparo', 'pronto', 'entregue'];
const STATUS_FINALIZADOS = ['finalizado', 'cancelado'];

export function HistoricoPedidosPage() {
  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['meus-pedidos'],
    queryFn: buscarHistorico,
    refetchInterval: 10000,
  });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando pedidos...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar seus pedidos.</p>;

  const emAndamento = pedidos.filter((p: any) => STATUS_EM_ANDAMENTO.includes(p.status));
  const finalizados = pedidos.filter((p: any) => STATUS_FINALIZADOS.includes(p.status));

  return (
    <div style={{ padding: 24 }}>
      <h1>Meus Pedidos</h1>

      <h2>Em andamento</h2>
      {emAndamento.length === 0 && <p>Nenhum pedido em andamento no momento.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {emAndamento.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
            <Link to={`/pedido/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong>Pedido #{p.id}</strong> — {new Date(p.criado_em).toLocaleString('pt-BR')} — <strong>{p.status}</strong>
              <ul>
                {(p.itens ?? []).map((i: any) => <li key={i.id}>{i.quantidade}x {i.nome} ({i.tamanho})</li>)}
              </ul>
              <p>Total: R$ {p.total}</p>
            </Link>
          </li>
        ))}
      </ul>

      <h2>Concluídos e cancelados</h2>
      {finalizados.length === 0 && <p>Nenhum pedido concluído ainda.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {finalizados.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8, opacity: 0.7 }}>
            <strong>Pedido #{p.id}</strong> — {new Date(p.criado_em).toLocaleString('pt-BR')} — {p.status}
            <ul>
              {(p.itens ?? []).map((i: any) => <li key={i.id}>{i.quantidade}x {i.nome} ({i.tamanho})</li>)}
            </ul>
            <p>Total: R$ {p.total}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
