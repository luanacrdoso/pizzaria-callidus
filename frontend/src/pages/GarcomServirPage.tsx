import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchComoFuncionario } from '../api/funcionarioAuth';
 
const API_URL = import.meta.env.VITE_API_URL;
 
async function buscarPedidosAServir() {
  const r = await fetchComoFuncionario(`${API_URL}/pedidos/cozinha`);
  if (!r.ok) throw new Error('Erro ao buscar pedidos.');
  const todos = await r.json();
  return todos.filter((p: any) => p.tipo === "presencial" && p.status === "pronto");
}
 
export function GarcomServirPage() {
  const queryClient = useQueryClient();
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos-a-servir'], queryFn: buscarPedidosAServir, refetchInterval: 5000
  });
 
  const mutationServir = useMutation({
    mutationFn: (id: number) => fetchComoFuncionario(`${API_URL}/pedidos/${id}/servido`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos-a-servir'] }),
  });
 
  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;
 
  return (
    <div style={{ padding: 24 }}>
      <h1>Pedidos Prontos para Servir</h1>
      {(!pedidos || pedidos.length === 0) && <p>Nenhum pedido esperando ser servido.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {pedidos?.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 8, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
            Pedido #{p.id} — {p.comanda_nome ?? p.cliente_nome} — Mesa {p.mesa_id}
            <button onClick={() => mutationServir.mutate(p.id)} style={{ marginLeft: 8 }}>✓ Servido</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
