import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarAvaliacao, enviarAvaliacao } from '../api/avaliacoes';
import { Estrelas } from '../components/Estrelas';

const API_URL = import.meta.env.VITE_API_URL;
const ETAPAS = [
  { chave: 'recebido', rotulo: 'Recebido', icone: '📥' },
  { chave: 'preparo', rotulo: 'Em Preparo', icone: '🧑‍🍳' },
  { chave: 'pronto', rotulo: 'Pronto', icone: '🍕' },
  { chave: 'entregue', rotulo: 'Entregue', icone: '✅' },
  { chave: 'finalizado', rotulo: 'Finalizado', icone: '💰' },
];

async function buscarConfig() { const r = await fetch(`${API_URL}/config`); return r.json(); }

export function AcompanhamentoPage() {
  const { pedidoId } = useParams();
  const queryClient = useQueryClient();

  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: async () => (await fetch(`${API_URL}/pedidos/${pedidoId}`)).json(),
    refetchInterval: 5000,
  });
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: buscarConfig });
  const { data: avaliacao } = useQuery({
    queryKey: ['avaliacao', pedidoId], queryFn: () => buscarAvaliacao(Number(pedidoId)),
    enabled: pedido?.status === 'finalizado',
  });

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const mutationAvaliar = useMutation({
    mutationFn: () => enviarAvaliacao(Number(pedidoId), nota, comentario),
    onSuccess: () => { setEnviado(true); queryClient.invalidateQueries({ queryKey: ['avaliacao', pedidoId] }); },
  });

  if (isLoading || !pedido) return <p>Carregando pedido...</p>;

  const indiceAtual = ETAPAS.findIndex((e) => e.chave === pedido.status);
  const telefoneLimpo = (config?.telefone ?? '').replace(/\D/g, '');

  if (pedido.status === 'aguardando_pagamento') {
    return <div className="card-central text-center"><h1>Pedido #{pedido.id}</h1><p>Aguardando a pizzaria confirmar o recebimento do Pix...</p></div>;
  }
  if (pedido.status === 'cancelado') {
    return <div className="card-central text-center"><h1>Pedido #{pedido.id}</h1><p>Este pedido foi cancelado.</p></div>;
  }

  return (
    <div className="card-central">
      <h1 className="text-center">Acompanhe seu Pedido #{pedido.id}</h1>

      <div className="timeline-pedido">
        {ETAPAS.map((e, i) => (
          <div key={e.chave} className={`timeline-etapa ${i < indiceAtual ? 'concluida' : ''} ${i === indiceAtual ? 'atual' : ''}`}>
            <div className="timeline-icone">{i <= indiceAtual ? e.icone : '⏳'}</div>
            <span>{e.rotulo}</span>
          </div>
        ))}
      </div>

      <div className="box-resumo-pedido">
        <h3>Resumo do Pedido</h3>
        <ul>
          {(pedido.itens ?? []).map((i: any) => (
            <li key={i.id} style={{ textDecoration: i.status === 'cancelado' ? 'line-through' : 'none' }}>
              {i.quantidade}x {i.nome} {i.tamanho !== '-' && `(${i.tamanho})`}
            </li>
          ))}
        </ul>
        <p><strong>Total:</strong> R$ {pedido.total}</p>
        {pedido.endereco_entrega && <p><strong>Entrega em:</strong> {pedido.endereco_entrega}</p>}
      </div>

      <div className="text-center">
        <p><strong>Precisa falar com a pizzaria?</strong></p>
        <div className="contato-pills">
          <a href={`tel:${telefoneLimpo}`} className="pill-contato">📞 Ligar</a>
          <a href={`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(`Olá! Sobre o pedido #${pedido.id}`)}`} target="_blank" rel="noreferrer" className="pill-contato">💬 WhatsApp</a>
        </div>
      </div>

      {pedido.status === 'finalizado' && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }} className="text-center">
          {avaliacao || enviado ? (
            <div><p>Obrigado pela avaliação!</p><Estrelas valor={avaliacao?.nota ?? nota} /></div>
          ) : (
            <div>
              <h3>Avalie seu pedido</h3>
              <Estrelas valor={nota} onSelecionar={setNota} tamanho={32} />
              <textarea placeholder="Comentário (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ marginTop: 8 }} />
              <button onClick={() => mutationAvaliar.mutate()} disabled={nota === 0} style={{ marginTop: 8 }}>Enviar Avaliação</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}