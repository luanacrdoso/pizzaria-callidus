import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;
const ETAPAS = ["recebido", "preparo", "pronto", "entregue", "finalizado"];

async function buscarConfig() {
  const r = await fetch(`${API_URL}/config`);
  return r.json();
}

export function AcompanhamentoPage() {
  const { pedidoId } = useParams();
  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: async () => (await fetch(`${API_URL}/pedidos/${pedidoId}`)).json(),
    refetchInterval: 5000,
  });
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: buscarConfig });

  if (isLoading || !pedido) return <p>Carregando pedido...</p>;

  const linkWhatsapp = () => {
    const telefone = (config?.telefone ?? '').replace(/\D/g, '');
    const mensagem = `Olá! Sobre o pedido #${pedido.id}, gostaria de fazer uma alteração ou cancelamento.`;
    return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
  };

  const BotaoContato = () => (
    <a href={linkWhatsapp()} target="_blank" rel="noreferrer">
      <button style={{ marginTop: 12 }}>Falar com a pizzaria (alterar/cancelar)</button>
    </a>
  );

  if (pedido.status === 'aguardando_pagamento') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Pedido #{pedido.id}</h1>
        <p>Aguardando a pizzaria confirmar o recebimento do Pix...</p>
        <BotaoContato />
      </div>
    );
  }

  if (pedido.status === 'cancelado') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Pedido #{pedido.id}</h1>
        <p>Este pedido foi cancelado.</p>
        <BotaoContato />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Pedido #{pedido.id}</h1>
      <p>Status atual: <strong>{pedido.status}</strong></p>
      <ol>
        {ETAPAS.map((etapa) => (
          <li key={etapa} style={{ fontWeight: pedido.status === etapa ? "bold" : "normal" }}>{etapa}</li>
        ))}
      </ol>
      <h2>Itens</h2>
      <ul>
        {(pedido.itens ?? []).map((i: any) => (
          <li key={i.id} style={{ textDecoration: i.status === 'cancelado' ? 'line-through' : 'none', color: i.status === 'cancelado' ? '#999' : 'inherit' }}>
            {i.quantidade}x {i.nome} ({i.tamanho})
          </li>
        ))}
      </ul>
      <BotaoContato />
    </div>
  );
}