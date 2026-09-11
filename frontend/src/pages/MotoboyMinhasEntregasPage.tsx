import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarMinhasEntregas, atualizarStatusEntrega } from '../api/motoboy';

type Entrega = {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  endereco_entrega: string;
  status: string;
};

function linkWhatsapp(telefone: string, pedidoId: number) {
  const numero = (telefone ?? "").replace(/\D/g, "");
  const mensagem = `Olá! Sou o entregador do seu pedido #${pedidoId} da Pizzaria.`;
  return `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function MotoboyMinhasEntregasPage() {
  const queryClient = useQueryClient();

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['minhas-entregas'],
    queryFn: buscarMinhasEntregas,
    refetchInterval: 8000
  });

  const mutationStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      atualizarStatusEntrega(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['minhas-entregas'] }),
  });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Minhas Entregas em Andamento</h1>

      {(!entregas || entregas.length === 0) && <p>Nenhuma entrega em andamento.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {entregas?.map((p: Entrega) => (
          <li
            key={p.id}
            style={{ marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <strong>Pedido #{p.id}</strong> — {p.cliente_nome}

            <p>{p.endereco_entrega}</p>

            <a
              href={linkWhatsapp(p.cliente_telefone, p.id)}
              target="_blank"
              rel="noreferrer"
            >
              Falar com o cliente
            </a>

            <div style={{ marginTop: 8 }}>
              <select
                value={p.status}
                onChange={(e) =>
                  mutationStatus.mutate({ id: p.id, status: e.target.value })
                }
              >
                <option value="pronto">A caminho</option>
                <option value="entregue">Entregue</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}