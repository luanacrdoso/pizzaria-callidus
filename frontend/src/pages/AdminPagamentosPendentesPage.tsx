import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAutenticado } from '../api/auth';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarPendentes() {
  const r = await fetchAutenticado(`${API_URL}/pedidos/pendentes-pagamento`);
  if (!r.ok) throw new Error('Erro ao buscar pagamentos pendentes.');
  return r.json();
}

export function AdminPagamentosPendentesPage() {
  const queryClient = useQueryClient();
  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pagamentos-pendentes'], queryFn: buscarPendentes, refetchInterval: 10000
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['pagamentos-pendentes'] });

  const mutationConfirmar = useMutation({
    mutationFn: (id: number) => fetchAutenticado(`${API_URL}/pedidos/${id}/confirmar-pagamento`, { method: 'PUT' }),
    onSuccess: invalidar,
  });
  const mutationRecusar = useMutation({
    mutationFn: (id: number) => fetchAutenticado(`${API_URL}/pedidos/${id}/recusar-pagamento`, { method: 'PUT' }),
    onSuccess: invalidar,
  });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Pagamentos Pix Pendentes</h1>
      {pedidos.length === 0 && <p>Nenhum pagamento aguardando confirmação.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pedidos.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
            <strong>Pedido #{p.id}</strong> — {p.cliente_nome} — R$ {p.total}
            <ul>
              {(p.itens ?? []).map((i: any) => <li key={i.id}>{i.quantidade}x {i.nome} ({i.tamanho})</li>)}
            </ul>
            <Link to={`/admin/pedidos/${p.id}`}>Ver/editar itens</Link>
            <button onClick={() => mutationConfirmar.mutate(p.id)}>Confirmar pagamento recebido</button>{' '}
            <button onClick={() => mutationRecusar.mutate(p.id)}>Não recebi / Cancelar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}