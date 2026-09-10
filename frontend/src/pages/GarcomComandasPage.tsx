import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarMesas } from '../api/mesas';
import { buscarComandas, adicionarItemAoPedido, registrarPagamento } from '../api/comandas';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
import { fetchComoFuncionario, obterUsernameFuncionario } from '../api/funcionarioAuth';
 
export function GarcomComandasPage() {
  const queryClient = useQueryClient();
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
  const [mesaId, setMesaId] = useState('');
 
  const { data: comandas } = useQuery({
    queryKey: ['comandas', mesaId],
    queryFn: () => buscarComandas(Number(mesaId)),
    enabled: !!mesaId,
  });
 
  const [novaComandaNome, setNovaComandaNome] = useState('');
  const [incluirGorjeta, setIncluirGorjeta] = useState(false);
  const [itensNovos, setItensNovos] = useState<any[]>([]);
  // [reaproveitar a montagem de item do Balcão aqui: produto/tamanho/sabores/combo/adicionais/quantidade/observações,
  //  acrescentando cada item escolhido no array itensNovos via setItensNovos]
 
  const invalidarComandas = () => queryClient.invalidateQueries({ queryKey: ['comandas', mesaId] });
 
  const handleAbrirComanda = async () => {
    if (!novaComandaNome || itensNovos.length === 0) return;
    const subtotal = itensNovos.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
    const gorjeta = incluirGorjeta ? Number((subtotal * 0.10).toFixed(2)) : 0;
    await criarPedidoPresencial({
      tipo: "presencial", mesa_id: Number(mesaId), comanda_nome: novaComandaNome,
      garcom_username: obterUsernameFuncionario(), cliente_nome: novaComandaNome,
      itens: itensNovos, subtotal, taxa_entrega: 0, total: subtotal + gorjeta,
      gorjeta_valor: gorjeta, forma_pagamento: "A definir",
    });
    setNovaComandaNome(""); setItensNovos([]); setIncluirGorjeta(false);
    invalidarComandas();
  };
 
  const handleAdicionarNaComanda = async (pedidoId: number) => {
    for (const item of itensNovos) {
      await adicionarItemAoPedido(pedidoId, item);
    }
    setItensNovos([]);
    invalidarComandas();
  };
 
  const handleFecharComanda = async (pedidoId: number, total: number, nomePagador: string) => {
    await registrarPagamento(pedidoId, { nome_pagador: nomePagador, valor_pago: total, forma_pagamento: "Dinheiro" });
    await fetchComoFuncionario(`${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "finalizado" })
    });
    invalidarComandas();
  };
 
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Comandas</h1>
 
      <select value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
        <option value="">Selecione a mesa</option>
        {mesas?.map((m: any) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
      </select>
 
      {mesaId && (
        <>
          <h2>Comandas abertas nesta mesa</h2>
          {(!comandas || comandas.length === 0) && <p>Nenhuma comanda aberta ainda.</p>}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {comandas?.map((c: any) => (
              <li key={c.id} style={{ marginBottom: 8, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
                <strong>{c.comanda_nome}</strong> — R$ {c.total}
                <button onClick={() => handleAdicionarNaComanda(c.id)} disabled={itensNovos.length === 0} style={{ marginLeft: 8 }}>
                  Adicionar itens montados abaixo
                </button>
                <button onClick={() => handleFecharComanda(c.id, c.total, c.comanda_nome)} style={{ marginLeft: 8 }}>
                  Fechar e pagar
                </button>
              </li>
            ))}
          </ul>
 
          <h2>Montar itens (para nova comanda ou para adicionar numa existente)</h2>
          {/* [aqui entra a UI de montagem de item reaproveitada do Balcão] */}
          <ul>
            {itensNovos.map((i, idx) => <li key={idx}>{i.quantidade}x {i.nome}</li>)}
          </ul>
 
          <h2>Abrir nova comanda com os itens montados acima</h2>
          <input placeholder="Nome do responsável pela comanda" value={novaComandaNome} onChange={(e) => setNovaComandaNome(e.target.value)} />
          <label style={{ display: "block", marginTop: 4 }}>
            <input type="checkbox" checked={incluirGorjeta} onChange={(e) => setIncluirGorjeta(e.target.checked)} />
            {" "}Incluir gorjeta de 10%
          </label>
          <button onClick={handleAbrirComanda} disabled={!novaComandaNome || itensNovos.length === 0}>Abrir Comanda</button>
        </>
      )}
    </div>
  );
}
