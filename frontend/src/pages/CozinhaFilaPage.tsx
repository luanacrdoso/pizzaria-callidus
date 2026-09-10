import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarFilaCozinha, atualizarStatusPedido } from '../api/pedidosEquipe';
 
export function CozinhaFilaPage() {
  const queryClient = useQueryClient();
  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['fila-cozinha'], queryFn: buscarFilaCozinha, refetchInterval: 5000
  });
 
  const mutationStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => atualizarStatusPedido(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fila-cozinha'] }),
  });
 
  if (isLoading) return <p style={{ padding: 24 }}>Carregando fila...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar a fila.</p>;
 
  return (
    <div style={{ padding: 24 }}>
      <h1>Fila da Cozinha</h1>
      {pedidos.length === 0 && <p>Nenhum pedido para preparar no momento.</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {pedidos.map((p: any) => (
          <div key={p.id} style={{ border: "2px solid #333", borderRadius: 8, padding: 16, minWidth: 260 }}>
            <h2 style={{ marginTop: 0 }}>Pedido #{p.id} — {p.tipo}</h2>
            <p style={{ fontSize: 13, color: "#666" }}>{new Date(p.criado_em).toLocaleTimeString("pt-BR")}</p>
            <ul>
              {(p.itens ?? []).filter((i: any) => i.status === "ativo").map((i: any) => (
                <li key={i.id} style={{ marginBottom: 6 }}>
                  <strong>{i.quantidade}x {i.nome}</strong> ({i.tamanho})
                  {i.extras?.length > 0 && <div style={{ fontSize: 13 }}>+ {i.extras.join(", ")}</div>}
                  {i.observacoes && <div style={{ fontSize: 13, color: "#c0392b" }}>Obs: {i.observacoes}</div>}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => mutationStatus.mutate({ id: p.id, status: "preparo" })} disabled={p.status === "preparo"}>
                Em preparo
              </button>
              <button onClick={() => mutationStatus.mutate({ id: p.id, status: "pronto" })}>
                Pronto
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
