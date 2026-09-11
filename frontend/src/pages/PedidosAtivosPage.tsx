import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarPedidosAtivos } from '../api/pedidosAtivos';
import { buscarMesas } from '../api/mesas';

const API_URL = import.meta.env.VITE_API_URL;
const ROTULOS_TIPO: Record<string, string> = { entrega: 'Entrega', retirada: 'Retirada', presencial: 'Presencial' };

function headerAutenticacao(): HeadersInit {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('equipe_token');
  return { Authorization: `Bearer ${token}` };
}

export function PedidosAtivosPage({ destaque, permitirAtender }: { destaque?: 'retirada' | 'presencial'; permitirAtender?: boolean }) {
  const queryClient = useQueryClient();
  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pedidos-ativos'], queryFn: buscarPedidosAtivos, refetchInterval: 8000,
  });
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas, enabled: !!permitirAtender });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['pedidos-ativos'] });

  const mutationChamarMotoboy = useMutation({
    mutationFn: (id: number) => fetch(`${API_URL}/pedidos/${id}/chamar-motoboy`, { method: 'PUT', headers: headerAutenticacao() }),
    onSuccess: invalidar,
  });

  const mutationAtender = useMutation({
    mutationFn: ({ id, mesaId }: { id: number; mesaId: string }) =>
      fetch(`${API_URL}/pedidos/${id}/atender`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...headerAutenticacao() },
        body: JSON.stringify({ mesa_id: mesaId ? Number(mesaId) : null }),
      }),
    onSuccess: invalidar,
  });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando pedidos...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar pedidos.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Pedidos Ativos</h1>
      {pedidos.length === 0 && <p>Nenhum pedido ativo no momento.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pedidos.map((p: any) => {
          const emDestaque = destaque && p.tipo === destaque;
          const precisaAtender = permitirAtender && p.tipo === 'presencial' && !p.garcom_username;
          return (
            <li key={p.id} style={{
              marginBottom: 12, padding: 12, borderRadius: 6,
              border: precisaAtender ? '2px solid #e0a800' : emDestaque ? '2px solid #ef4444' : '1px solid #ddd',
              background: precisaAtender ? '#fffaf0' : emDestaque ? '#fff5f5' : 'transparent',
            }}>
              <strong>Pedido #{p.id}</strong> — {ROTULOS_TIPO[p.tipo] ?? p.tipo} — {p.status}
              {p.comanda_nome && <> — Comanda: {p.comanda_nome}</>}
              {p.mesa_id && <> — Mesa {p.mesa_id}</>}
              {p.tipo === 'presencial' && !p.mesa_id && <> — Mesa: a definir</>}
              <ul>
                {(p.itens ?? []).filter((i: any) => i.status === 'ativo').map((i: any) => (
                  <li key={i.id}>{i.quantidade}x {i.nome} ({i.tamanho})</li>
                ))}
              </ul>
              <p>Total: R$ {p.total}</p>

              {precisaAtender && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#7a5b00' }}>Pedido feito pelo Cliente, sem garçom ainda:</span>
                  {!p.mesa_id && (
                    <select id={`mesa-${p.id}`}>
                      <option value="">Definir mesa agora (opcional)</option>
                      {mesas?.map((m: any) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
                    </select>
                  )}
                  <button onClick={() => {
                    const select = document.getElementById(`mesa-${p.id}`) as HTMLSelectElement | null;
                    mutationAtender.mutate({ id: p.id, mesaId: select?.value ?? '' });
                  }}>
                    Atender este pedido
                  </button>
                </div>
              )}

              {p.tipo === 'entrega' && p.status === 'pronto' && !p.motoboy_chamado && (
                <button onClick={() => mutationChamarMotoboy.mutate(p.id)} style={{ marginTop: 8 }}>
                  Chamar entregador
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}