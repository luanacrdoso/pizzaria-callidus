import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarMesas } from '../api/mesas';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
 
const API_URL = import.meta.env.VITE_API_URL;
async function buscarCardapio() {
  const r = await fetch(`${API_URL}/pizzas?visivel=true`);
  return r.json();
}
 
export function BalcaoPedidoPresencialPage() {
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
  const { data: cardapio } = useQuery({ queryKey: ['cardapio-publico'], queryFn: buscarCardapio });
 
  const [mesaId, setMesaId] = useState('');
  const [itens, setItens] = useState<any[]>([]);
  const [pizzaSelecionada, setPizzaSelecionada] = useState('');
  const [tamanho, setTamanho] = useState('media');
  const [quantidade, setQuantidade] = useState(1);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
 
  const adicionarItem = () => {
    const pizza = cardapio?.find((p: any) => String(p.id) === pizzaSelecionada);
    if (!pizza) return;
    setItens([...itens, {
      pizzaId: pizza.id, nome: pizza.nome, tamanho, extras: [], observacoes: "",
      quantidade, precoUnitario: Number(pizza[`preco_${tamanho}`])
    }]);
    setPizzaSelecionada("");
    setQuantidade(1);
  };
 
  const removerItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
 
  const handleFinalizar = async () => {
    if (!mesaId || itens.length === 0) return;
    setErro(""); setSucesso("");
    try {
      const pedido = await criarPedidoPresencial({
        tipo: "presencial",
        mesa_id: Number(mesaId),
        cliente_nome: `Mesa ${mesas?.find((m: any) => m.id === Number(mesaId))?.numero ?? ""}`,
        itens, subtotal, taxa_entrega: 0, total: subtotal,
        forma_pagamento: "A definir",
      });
      setSucesso(`Pedido #${pedido.id} lançado com sucesso!`);
      setItens([]);
      setMesaId("");
    } catch (e: any) {
      setErro(e.message);
    }
  };
 
  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h1>Anotar Pedido Presencial</h1>
 
      <select value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
        <option value="">Selecione a mesa</option>
        {mesas?.map((m: any) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
      </select>
 
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
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
        <button onClick={adicionarItem} disabled={!pizzaSelecionada}>Adicionar</button>
      </div>
 
      <h2>Itens do pedido</h2>
      <ul>
        {itens.map((i, idx) => (
          <li key={idx}>
            {i.quantidade}x {i.nome} ({i.tamanho}) — R$ {(i.precoUnitario * i.quantidade).toFixed(2)}
            <button onClick={() => removerItem(idx)} style={{ marginLeft: 8 }}>Remover</button>
          </li>
        ))}
      </ul>
      <p><strong>Total: R$ {subtotal.toFixed(2)}</strong></p>
 
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {sucesso && <p style={{ color: "green" }}>{sucesso}</p>}
      <button onClick={handleFinalizar} disabled={!mesaId || itens.length === 0}>Lançar Pedido</button>
    </div>
  );
}
