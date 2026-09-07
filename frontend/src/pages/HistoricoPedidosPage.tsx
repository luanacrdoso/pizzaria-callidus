import { useQuery } from '@tanstack/react-query';
import { fetchComoCliente } from '../api/clienteAuth';

const API_URL = import.meta.env.VITE_API_URL;

interface ItemPedido {
  id: number;
  quantidade: number;
  nome: string;
  tamanho: string;
}

interface Pedido {
  id: number;
  criado_em: string;
  status: string;
  total: number | string;
  itens?: ItemPedido[];
}

export function HistoricoPedidosPage() {
  const {
    data: pedidos = [],
    isLoading,
    isError
  } = useQuery<Pedido[]>({
    queryKey: ['meus-pedidos'],

    queryFn: async () => {
      const r = await fetchComoCliente(`${API_URL}/pedidos/meus`);

      if (!r.ok) {
        throw new Error('Erro');
      }

      return r.json();
    },
  });

  if (isLoading) {
    return <p>Carregando histórico...</p>;
  }

  if (isError) {
    return <p>Faça login para ver seu histórico de pedidos.</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Meus Pedidos</h1>

      {pedidos.length === 0 && (
        <p>Você ainda não fez nenhum pedido.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {pedidos.map((p) => (
          <li
            key={p.id}
            style={{
              marginBottom: 12,
              borderBottom: "1px solid #eee",
              paddingBottom: 8
            }}
          >
            <strong>Pedido #{p.id}</strong>
            {' — '}
            {new Date(p.criado_em).toLocaleString("pt-BR")}
            {' — '}
            {p.status}

            <ul>
              {(p.itens ?? []).map((i) => (
                <li key={i.id}>
                  {i.quantidade}x {i.nome} ({i.tamanho})
                </li>
              ))}
            </ul>

            <p>Total: R$ {p.total}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}