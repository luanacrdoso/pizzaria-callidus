import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAutenticado } from '../api/auth';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarPedido(id: string) {
  const r = await fetch(`${API_URL}/pedidos/${id}`);
  if (!r.ok) throw new Error('Pedido não encontrado.');
  return r.json();
}
async function buscarCardapio() {
  const r = await fetch(`${API_URL}/pizzas`);
  return r.json();
}

export function AdminPedidoDetalhePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: pedido, isLoading } = useQuery({ queryKey: ['pedido-admin', id], queryFn: () => buscarPedido(id!) });
  const { data: cardapio } = useQuery({ queryKey: ['pizzas'], queryFn: buscarCardapio });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['pedido-admin', id] });

  const mutationCancelarItem = useMutation({
    mutationFn: (itemId: number) => fetchAutenticado(`${API_URL}/pedidos/${id}/itens/${itemId}/cancelar`, { method: 'PUT' }),
    onSuccess: invalidar,
  });

  const mutationAdicionarItem = useMutation({
    mutationFn: (dados: any) => fetchAutenticado(`${API_URL}/pedidos/${id}/itens`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados)
    }),
    onSuccess: invalidar,
  });

  const mutationStatus = useMutation({
    mutationFn: (status: string) => fetchAutenticado(`${API_URL}/pedidos/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    }),
    onSuccess: invalidar,
  });

  const [pizzaSelecionada, setPizzaSelecionada] = useState('');
  const [tamanho, setTamanho] = useState('media');
  const [quantidade, setQuantidade] = useState(1);

  if (isLoading || !pedido) return <p style={{ padding: 24 }}>Carregando pedido...</p>;

  const handleAdicionar = () => {
    const pizza = cardapio?.find((p: any) => String(p.id) === pizzaSelecionada);
    if (!pizza) return;
    mutationAdicionarItem.mutate({
      pizza_id: pizza.id,
      nome: pizza.nome,
      tamanho,
      extras: [],
      observacoes: '',
      quantidade,
      preco_unitario: Number(pizza[`preco_${tamanho}`]),
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h1>Pedido #{pedido.id}</h1>
      <p>Cliente: {pedido.cliente_nome} — Status: <strong>{pedido.status}</strong></p>

      <h2>Itens</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(pedido.itens ?? []).map((i: any) => {
          const ehNovo = new Date(i.criado_em).getTime() - new Date(pedido.criado_em).getTime() > 5000;
          return (
            <li key={i.id} style={{
              marginBottom: 6,
              textDecoration: i.status === 'cancelado' ? 'line-through' : 'none',
              color: i.status === 'cancelado' ? '#999' : (ehNovo ? 'green' : 'inherit')
            }}>
              {i.quantidade}x {i.nome} ({i.tamanho}) — R$ {i.preco_unitario}
              {i.status === 'ativo' && (
                <button onClick={() => mutationCancelarItem.mutate(i.id)} style={{ marginLeft: 8 }}>Cancelar item</button>
              )}
            </li>
          );
        })}
      </ul>

      <h2>Adicionar item</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={pizzaSelecionada} onChange={(e) => setPizzaSelecionada(e.target.value)}>
          <option value="">Selecione um item</option>
          {cardapio?.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={tamanho} onChange={(e) => setTamanho(e.target.value)}>
          <option value="brotinho">Brotinho</option>
          <option value="media">Média</option>
          <option value="grande">Grande</option>
        </select>
        <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} style={{ width: 60 }} />
        <button onClick={handleAdicionar} disabled={!pizzaSelecionada}>Adicionar</button>
      </div>

      <h2>Total atualizado: R$ {pedido.total}</h2>

      <button onClick={() => mutationStatus.mutate('cancelado')} style={{ marginTop: 16, background: '#c0392b', color: 'white' }}>
        Cancelar pedido inteiro
      </button>
    </div>
  );
}