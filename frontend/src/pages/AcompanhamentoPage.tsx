import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

const ETAPAS = ["recebido", "preparo", "pronto", "entregue", "finalizado"];

interface Pedido {
  id: number;
  status: string;
}

export function AcompanhamentoPage() {
  const { pedidoId } = useParams();

  const { data: pedido, isLoading } = useQuery<Pedido>({
    queryKey: ["pedido", pedidoId],

    queryFn: async () => {
      const resposta = await fetch(`${API_URL}/pedidos/${pedidoId}`);

      if (!resposta.ok) {
        throw new Error('Erro ao buscar pedido.');
      }

      return resposta.json();
    },

    refetchInterval: 5000,
  });

  if (isLoading || !pedido) {
    return <p>Carregando pedido...</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Pedido #{pedido.id}</h1>

      <p>
        Status atual: <strong>{pedido.status}</strong>
      </p>

      <ol>
        {ETAPAS.map((etapa) => (
          <li
            key={etapa}
            style={{
              fontWeight: pedido.status === etapa ? "bold" : "normal"
            }}
          >
            {etapa}
          </li>
        ))}
      </ol>
    </div>
  );
}