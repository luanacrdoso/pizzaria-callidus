import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarPedidosRetirada, atualizarStatusPedido } from '../api/pedidosEquipe';
 
export function BalcaoRetiradaPage() {
  const queryClient = useQueryClient();
  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pedidos-retirada'], queryFn: buscarPedidosRetirada, refetchInterval: 10000
  });
 
  const mutationStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => atualizarStatusPedido(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos-retirada'] }),
  });
 
  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar pedidos de retirada.</p>;
 
  return (
    <div style={{ padding: 24 }}>
      <h1>Pedidos para Retirada</h1>
      {pedidos.length === 0 && <p>Nenhum pedido de retirada no momento.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {pedidos.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 6 }}>
            <strong>Pedido #{p.id}</strong> — {p.cliente_nome} — {p.status}
            <ul>
              {(p.itens ?? []).map((i: any) => <li key={i.id}>{i.quantidade}x {i.nome} ({i.tamanho})</li>)}
            </ul>
            <select value={p.status} onChange={(e) => mutationStatus.mutate({ id: p.id, status: e.target.value })}>
              <option value="recebido">Recebido</option>
              <option value="preparo">Preparo</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Retirado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
