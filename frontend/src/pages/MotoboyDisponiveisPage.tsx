import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarEntregasDisponiveis, assumirEntrega } from '../api/motoboy';

type ItemEntrega = {
  id: number;
  quantidade: number;
  nome: string;
  tamanho: string;
};

type Entrega = {
  id: number;
  cliente_nome: string;
  endereco_entrega: string;
  cliente_telefone: string;
  total: number;
  taxa_entrega: number;
  itens: ItemEntrega[];
};

export function MotoboyDisponiveisPage() {
  const queryClient = useQueryClient();

  const { data: entregas, isLoading, isError } = useQuery({
    queryKey: ['entregas-disponiveis'],
    queryFn: buscarEntregasDisponiveis,
    refetchInterval: 8000
  });

  const mutationAssumir = useMutation({
    mutationFn: assumirEntrega,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-disponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-entregas'] });
    },
  });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar entregas.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Entregas Disponíveis</h1>

      {entregas.length === 0 && (
        <p>Nenhuma entrega chamada pela cozinha no momento.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {entregas.map((p: Entrega) => (
          <li
            key={p.id}
            style={{ marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <strong>Pedido #{p.id}</strong> — {p.cliente_nome}

            <p><strong>Endereço:</strong> {p.endereco_entrega}</p>
            <p><strong>Telefone:</strong> {p.cliente_telefone}</p>

            <p>
              <strong>Total:</strong> R$ {p.total} —{" "}
              <strong>Taxa de entrega:</strong> R$ {p.taxa_entrega}
            </p>

            <ul>
              {(p.itens ?? []).map((i: ItemEntrega) => (
                <li key={i.id}>
                  {i.quantidade}x {i.nome} ({i.tamanho})
                </li>
              ))}
            </ul>

            <button onClick={() => mutationAssumir.mutate(p.id)}>
              Assumir Entrega
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}