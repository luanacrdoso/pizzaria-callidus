import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarPedidosAdmin } from '../api/pedidosAdmin';

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7dias', rotulo: 'Últimos 7 dias' },
  { valor: 'mes', rotulo: 'Último mês' },
  { valor: 'ano', rotulo: 'Último ano' },
  { valor: 'todos', rotulo: 'Todos' },
];

export function AdminPedidosPage() {
  const [periodo, setPeriodo] = useState('hoje');
  const [anoEspecifico, setAnoEspecifico] = useState('');

  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pedidos-admin', periodo, anoEspecifico],
    queryFn: () => buscarPedidosAdmin(periodo, anoEspecifico || undefined),
  });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando pedidos...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar pedidos.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Histórico de Pedidos</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {PERIODOS.map((p) => (
          <button key={p.valor} onClick={() => { setPeriodo(p.valor); setAnoEspecifico(''); }} disabled={periodo === p.valor && !anoEspecifico}>
            {p.rotulo}
          </button>
        ))}
        <input type="number" placeholder="Ano específico (ex: 2025)" value={anoEspecifico} onChange={(e) => setAnoEspecifico(e.target.value)} style={{ width: 170 }} />
      </div>

      {pedidos.length === 0 && <p>Nenhum pedido concluído ou cancelado nesse período.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pedidos.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
            <strong>Pedido #{p.id}</strong> — {new Date(p.criado_em).toLocaleString('pt-BR')} — {p.tipo} — <strong>{p.status}</strong>
            <p>Cliente: {p.cliente_nome} {p.comanda_nome && `(comanda: ${p.comanda_nome})`}</p>
            {p.garcom_username && <p>Garçom: {p.garcom_username}</p>}
            {p.motoboy_username && <p>Motoboy: {p.motoboy_username}</p>}
            <ul>
              {(p.itens ?? []).map((i: any) => (
                <li key={i.id} style={{ textDecoration: i.status === 'cancelado' ? 'line-through' : 'none' }}>
                  {i.quantidade}x {i.nome} ({i.tamanho})
                </li>
              ))}
            </ul>
            <p><strong>Pagamento:</strong></p>
            <ul>
              {(p.pagamentos ?? []).map((pg: any) => (
                <li key={pg.id}>{pg.nome_pagador}: R$ {pg.valor_pago} ({pg.forma_pagamento})</li>
              ))}
            </ul>
            {p.gorjeta_valor > 0 && <p>Gorjeta: R$ {p.gorjeta_valor}</p>}
            <p><strong>Total: R$ {p.total}</strong></p>
          </li>
        ))}
      </ul>
    </div>
  );
}