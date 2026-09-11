import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarDashboardAdmin } from '../api/pedidosAdmin';
import { buscarMediaAvaliacoes } from '../api/avaliacoes';
import { Estrelas } from '../components/Estrelas';

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7dias', rotulo: 'Últimos 7 dias' },
  { valor: 'mes', rotulo: 'Último mês' },
  { valor: 'ano', rotulo: 'Último ano' },
  { valor: 'todos', rotulo: 'Todos' },
];

export function AdminDashboardPage() {
  const [periodo, setPeriodo] = useState('hoje');
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-admin', periodo], queryFn: () => buscarDashboardAdmin(periodo) });
  const { data: avaliacaoMedia } = useQuery({ queryKey: ['media-avaliacoes'], queryFn: buscarMediaAvaliacoes });

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PERIODOS.map((p) => (
          <button key={p.valor} onClick={() => setPeriodo(p.valor)} disabled={periodo === p.valor}>{p.rotulo}</button>
        ))}
      </div>

      {isLoading ? <p>Carregando...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}><p>Total de pedidos</p><h2>{data?.total_pedidos}</h2></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}><p>Faturamento</p><h2>R$ {data?.faturamento?.toFixed(2)}</h2></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}><p>Entrega</p><h2>{data?.pedidos_entrega}</h2></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}><p>Retirada</p><h2>{data?.pedidos_retirada}</h2></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}><p>Presencial</p><h2>{data?.pedidos_presencial}</h2></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}><p>Funcionários ativos</p><h2>{data?.funcionarios_ativos}</h2></div>
          </div>

          <h2 style={{ marginTop: 24 }}>Avaliação dos Clientes</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Estrelas valor={Math.round(avaliacaoMedia?.media ?? 0)} tamanho={28} />
            <span>{avaliacaoMedia?.media?.toFixed(1) ?? '0.0'} ({avaliacaoMedia?.total_avaliacoes ?? 0} avaliações)</span>
          </div>

          <h2 style={{ marginTop: 24 }}>Gorjetas dos Garçons</h2>
          <p>Total arrecadado: <strong>R$ {data?.gorjeta?.total?.toFixed(2) ?? '0.00'}</strong></p>
          {(data?.gorjeta?.por_garcom?.length ?? 0) === 0 && <p>Nenhuma gorjeta registrada no período.</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data?.gorjeta?.por_garcom?.map((g: any) => (
              <li key={g.username}>{g.username}: R$ {g.valor.toFixed(2)}</li>
            ))}
          </ul>

          <h2 style={{ marginTop: 24 }}>Ganhos dos Motoboys</h2>
          <p>Total pago em taxas de entrega: <strong>R$ {data?.motoboy?.total?.toFixed(2) ?? '0.00'}</strong></p>
          {(data?.motoboy?.por_motoboy?.length ?? 0) === 0 && <p>Nenhuma entrega finalizada no período.</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data?.motoboy?.por_motoboy?.map((m: any) => (
              <li key={m.username}>{m.username}: {m.quantidade_entregas} entregas — R$ {m.valor.toFixed(2)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}