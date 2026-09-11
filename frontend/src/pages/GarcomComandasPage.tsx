import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarMesas } from '../api/mesas';
import { buscarPizzas, buscarPizzaPorId } from '../api/pizzas';
import { useSearchParams } from 'react-router-dom';

async function buscarCardapioComoAny(): Promise<any[]> {
  const pizzas = await buscarPizzas();
  return pizzas as any[];
}
import { buscarAdicionais } from '../api/adicionais';
import { buscarCategorias } from '../api/categorias';
import { buscarComandas, adicionarItemAoPedido, registrarPagamento } from '../api/comandas';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
import { fetchComoFuncionario, obterUsernameFuncionario } from '../api/funcionarioAuth';
import { calcularPrecoPizzaMultiplosSabores } from '../api/precos';

const TAMANHOS = [
  { chave: 'brotinho', rotulo: 'Brotinho' },
  { chave: 'media', rotulo: 'Média' },
  { chave: 'grande', rotulo: 'Grande' },
];

export function GarcomComandasPage() {
  const queryClient = useQueryClient();
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
  const { data: cardapio } = useQuery<any[]>({ queryKey: ['pizzas'], queryFn: buscarCardapioComoAny });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const [mesaId, setMesaId] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mesaDaUrl = searchParams.get('mesa');
    const comandaDaUrl = searchParams.get('comanda');
    if (mesaDaUrl) setMesaId(mesaDaUrl);
    if (comandaDaUrl) setComandaAlvo(Number(comandaDaUrl));
  }, [searchParams]);
  const { data: comandas } = useQuery({
    queryKey: ['comandas', mesaId], queryFn: () => buscarComandas(Number(mesaId)), enabled: !!mesaId,
  });
  const invalidarComandas = () => queryClient.invalidateQueries({ queryKey: ['comandas', mesaId] });

  // null = vai abrir comanda nova; número = vai adicionar itens numa comanda já existente
  const [comandaAlvo, setComandaAlvo] = useState<number | null>(null);
  const [novaComandaNome, setNovaComandaNome] = useState('');
  const [incluirGorjeta, setIncluirGorjeta] = useState(false);

  const [itens, setItens] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [produtoId, setProdutoId] = useState('');
  const [detalhe, setDetalhe] = useState<any>(null);
  const [tamanho, setTamanho] = useState('media');
  const [saboresSelecionados, setSaboresSelecionados] = useState<number[]>([]);
  const [extrasSelecionados, setExtrasSelecionados] = useState<{ nome: string; preco: number }[]>([]);
  const [escolhasCombo, setEscolhasCombo] = useState<Record<number, string[]>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');

  const produto: any = cardapio?.find((p: any) => String(p.id) === produtoId);

  useEffect(() => {
    setDetalhe(null); setSaboresSelecionados([]); setEscolhasCombo({}); setTamanho('media');
    if (produtoId) buscarPizzaPorId(Number(produtoId)).then(setDetalhe);
  }, [produtoId]);

  const limparItemAtual = () => {
    setProdutoId(''); setDetalhe(null); setTamanho('media');
    setSaboresSelecionados([]); setExtrasSelecionados([]); setEscolhasCombo({});
    setQuantidade(1); setObservacoes('');
  };

  const toggleExtra = (a: any) => {
    const jaTem = extrasSelecionados.some((e) => e.nome === a.nome);
    setExtrasSelecionados(jaTem ? extrasSelecionados.filter((e) => e.nome !== a.nome) : [...extrasSelecionados, { nome: a.nome, preco: Number(a.preco) }]);
  };

  const toggleSabor = (id: number) => {
    const max = Number(detalhe?.[`max_sabores_${tamanho}`] ?? 99);
    setSaboresSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((s) => s !== id);
      if (atual.length >= max) return atual;
      return [...atual, id];
    });
  };

  const atualizarEscolhaCombo = (slotIndex: number, posicao: number, pizzaId: string) => {
    setEscolhasCombo((atual) => {
      const nova = [...(atual[slotIndex] ?? [])];
      nova[posicao] = pizzaId;
      return { ...atual, [slotIndex]: nova };
    });
  };

  const precoExtras = extrasSelecionados.reduce((s, e) => s + e.preco, 0);
  const nomeCategoria = (id: number) => categorias?.find((c: any) => c.id === id)?.nome ?? '';

  const montarNomeEPreco = (): { nome: string; precoUnitario: number } | null => {
    if (!produto) return null;
    if (produto.tipo === 'sabor_unico') {
      return { nome: produto.nome, precoUnitario: Number(produto[`preco_${tamanho}`] ?? 0) + precoExtras };
    }
    if (produto.tipo === 'personalizavel') {
      if (saboresSelecionados.length === 0) return null;
      const saboresObjetos = saboresSelecionados.map((id) => cardapio?.find((p: any) => p.id === id)).filter(Boolean) as any[];
      const precos = saboresObjetos.map((s) => Number(s[`preco_${tamanho}`] ?? 0));
      const precoBase = calcularPrecoPizzaMultiplosSabores(precos);
      return { nome: `${produto.nome}: ${saboresObjetos.map((s) => s.nome).join(' / ')}`, precoUnitario: precoBase + precoExtras };
    }
    if (produto.tipo === 'combo') {
      const slots = detalhe?.combo_slots ?? [];
      const nomesEscolhidos: string[] = [];
      for (let i = 0; i < slots.length; i++) {
        const escolhas = escolhasCombo[i] ?? [];
        for (let pos = 0; pos < slots[i].quantidade; pos++) {
          const idEscolhido = escolhas[pos];
          if (!idEscolhido) return null;
          const item = cardapio?.find((p: any) => String(p.id) === idEscolhido);
          if (item) nomesEscolhidos.push(item.nome);
        }
      }
      return { nome: `${produto.nome} (${nomesEscolhidos.join(', ')})`, precoUnitario: Number(produto.preco_combo ?? 0) + precoExtras };
    }
    return null;
  };

  const handleAdicionarItemNaLista = () => {
    const resultado = montarNomeEPreco();
    if (!resultado || !produto) { setErro('Complete todas as escolhas do item antes de adicionar.'); return; }
    setErro('');
    setItens([...itens, {
      pizzaId: produto.id, nome: resultado.nome, tamanho: produto.tipo === 'combo' ? '-' : tamanho,
      extras: extrasSelecionados.map((e) => e.nome), observacoes, quantidade, precoUnitario: resultado.precoUnitario,
    }]);
    limparItemAtual();
  };

  const removerItemDaLista = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const subtotalNovosItens = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);

  const handleConfirmarComanda = async () => {
    if (itens.length === 0) { setErro('Adicione pelo menos um item antes de confirmar.'); return; }
    setErro(''); setSucesso('');

    try {
      if (comandaAlvo === null) {
        if (!novaComandaNome) { setErro('Digite o nome do responsável pela nova comanda.'); return; }
        const gorjeta = incluirGorjeta ? Number((subtotalNovosItens * 0.10).toFixed(2)) : 0;
        await criarPedidoPresencial({
          tipo: 'presencial', mesa_id: Number(mesaId), comanda_nome: novaComandaNome,
          garcom_username: obterUsernameFuncionario(), cliente_nome: novaComandaNome,
          itens, subtotal: subtotalNovosItens, taxa_entrega: 0, total: subtotalNovosItens + gorjeta,
          gorjeta_valor: gorjeta, forma_pagamento: 'A definir',
        });
        setSucesso(`Comanda "${novaComandaNome}" aberta com sucesso!`);
        setNovaComandaNome(''); setIncluirGorjeta(false);
      } else {
        for (const item of itens) {
          await adicionarItemAoPedido(comandaAlvo, item);
        }
        setSucesso('Itens adicionados à comanda com sucesso!');
      }
      setItens([]);
      invalidarComandas();
    } catch (e: any) {
      setErro(e.message);
    }
  };

  const handleFecharComanda = async (pedidoId: number, total: number, nomePagador: string) => {
    await registrarPagamento(pedidoId, { nome_pagador: nomePagador, valor_pago: total, forma_pagamento: 'Dinheiro' });
    await fetchComoFuncionario(`${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'finalizado' }),
    });
    invalidarComandas();
  };

  return (
    <div style={{ padding: 24, maxWidth: 650 }}>
      <h1>Comandas</h1>

      <h2>Passo 1 — Escolha a mesa</h2>
      <select value={mesaId} onChange={(e) => { setMesaId(e.target.value); setComandaAlvo(null); }}>
        <option value="">Selecione a mesa</option>
        {mesas?.map((m: any) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
      </select>

      {mesaId && (
        <>
          <h2>Passo 2 — Comandas abertas nesta mesa</h2>
          {(!comandas || comandas.length === 0) && <p>Nenhuma comanda aberta ainda nesta mesa.</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {comandas?.map((c: any) => (
              <li key={c.id} style={{
                marginBottom: 8, padding: 8, borderRadius: 6,
                border: comandaAlvo === c.id ? '2px solid #ef4444' : '1px solid #ddd',
              }}>
                <strong>{c.comanda_nome}</strong> — R$ {c.total}
                <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                  <button onClick={() => setComandaAlvo(c.id)} disabled={comandaAlvo === c.id}>
                    {comandaAlvo === c.id ? 'Selecionada para receber itens' : 'Adicionar itens nesta comanda'}
                  </button>
                  <button onClick={() => handleFecharComanda(c.id, c.total, c.comanda_nome)}>Fechar e pagar</button>
                </div>
              </li>
            ))}
          </ul>

          <button onClick={() => setComandaAlvo(null)} style={{ marginBottom: 16 }}>
            {comandaAlvo === null ? '● Abrindo uma comanda nova' : 'Abrir uma comanda nova em vez disso'}
          </button>

          {comandaAlvo === null && (
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, marginBottom: 16 }}>
              <label>Nome do responsável pela nova comanda:
                <input value={novaComandaNome} onChange={(e) => setNovaComandaNome(e.target.value)} placeholder="Ex: João" style={{ marginLeft: 8 }} />
              </label>
              <label style={{ display: 'block', marginTop: 8 }}>
                <input type="checkbox" checked={incluirGorjeta} onChange={(e) => setIncluirGorjeta(e.target.checked)} />
                {' '}Incluir gorjeta de 10%
              </label>
            </div>
          )}

          <h2>Passo 3 — Monte os itens</h2>
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            <option value="">Selecione um produto</option>
            {cardapio?.map((p: any) => <option key={p.id} value={p.id}>{p.nome} ({p.categoria})</option>)}
          </select>

          {produto && produto.tipo === 'sabor_unico' && (
            <div style={{ marginTop: 8 }}>
              {TAMANHOS.filter((t) => produto[`preco_${t.chave}`]).map((t) => (
                <label key={t.chave} style={{ display: 'block' }}>
                  <input type="radio" checked={tamanho === t.chave} onChange={() => setTamanho(t.chave)} />
                  {' '}{t.rotulo} — R$ {Number(produto[`preco_${t.chave}`]).toFixed(2)}
                </label>
              ))}
            </div>
          )}

          {produto && produto.tipo === 'personalizavel' && detalhe && (
            <div style={{ marginTop: 8 }}>
              <p>Tamanho:</p>
              {TAMANHOS.filter((t) => produto[`preco_${t.chave}`]).map((t) => (
                <label key={t.chave} style={{ display: 'inline-block', marginRight: 12 }}>
                  <input type="radio" checked={tamanho === t.chave} onChange={() => { setTamanho(t.chave); setSaboresSelecionados([]); }} />
                  {' '}{t.rotulo}
                </label>
              ))}
              <p>Sabores (máx. {detalhe[`max_sabores_${tamanho}`] ?? '—'}):</p>
              {(detalhe.sabores_permitidos ?? []).map((saborId: number) => {
                const sabor = cardapio?.find((p: any) => p.id === saborId);
                if (!sabor) return null;
                return (
                  <label key={saborId} style={{ display: 'block' }}>
                    <input type="checkbox" checked={saboresSelecionados.includes(saborId)} onChange={() => toggleSabor(saborId)} />
                    {' '}{sabor.nome} (R$ {Number(sabor[`preco_${tamanho}`] ?? 0).toFixed(2)} inteira)
                  </label>
                );
              })}
            </div>
          )}

          {produto && produto.tipo === 'combo' && detalhe && (
            <div style={{ marginTop: 8 }}>
              <p><strong>Combo: R$ {Number(produto.preco_combo ?? 0).toFixed(2)}</strong></p>
              {(detalhe.combo_slots ?? []).map((slot: any, slotIndex: number) => (
                <div key={slotIndex} style={{ marginBottom: 8 }}>
                  <p>{slot.rotulo || nomeCategoria(slot.categoria_id)}</p>
                  {Array.from({ length: slot.quantidade }).map((_, pos) => (
                    <select
                      key={pos}
                      value={escolhasCombo[slotIndex]?.[pos] ?? ''}
                      onChange={(e) => atualizarEscolhaCombo(slotIndex, pos, e.target.value)}
                      style={{ marginRight: 8, marginBottom: 4 }}
                    >
                      <option value="">Escolha {pos + 1}</option>
                      {cardapio?.filter((p: any) => p.categoria_id === slot.categoria_id && p.tipo !== 'combo').map((p: any) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  ))}
                </div>
              ))}
            </div>
          )}

          {produto && (
            <>
              {(adicionais?.length ?? 0) > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p>Adicionais:</p>
                  {adicionais?.map((a: any) => (
                    <label key={a.id} style={{ display: 'block' }}>
                      <input type="checkbox" checked={extrasSelecionados.some((e) => e.nome === a.nome)} onChange={() => toggleExtra(a)} />
                      {' '}{a.nome} — R$ {Number(a.preco).toFixed(2)}
                    </label>
                  ))}
                </div>
              )}
              <textarea placeholder="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
              <div style={{ marginTop: 8 }}>
                Quantidade: <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} style={{ width: 60 }} />
              </div>
              <button onClick={handleAdicionarItemNaLista} style={{ marginTop: 8 }}>+ Adicionar item à lista abaixo</button>
            </>
          )}

          <h2>Passo 4 — Itens prontos para enviar</h2>
          {itens.length === 0 && <p>Nenhum item montado ainda.</p>}
          <ul>
            {itens.map((i, idx) => (
              <li key={idx}>
                {i.quantidade}x {i.nome} {i.tamanho !== '-' && `(${i.tamanho})`}
                {i.extras.length > 0 && ` + ${i.extras.join(', ')}`}
                {' — R$ '}{(i.precoUnitario * i.quantidade).toFixed(2)}
                <button onClick={() => removerItemDaLista(idx)} style={{ marginLeft: 8 }}>Remover</button>
              </li>
            ))}
          </ul>
          <p><strong>Subtotal destes itens: R$ {subtotalNovosItens.toFixed(2)}</strong></p>

          {erro && <p style={{ color: 'red' }}>{erro}</p>}
          {sucesso && <p style={{ color: 'green' }}>{sucesso}</p>}

          <button onClick={handleConfirmarComanda} disabled={itens.length === 0} style={{ padding: '8px 16px', fontWeight: 'bold' }}>
            {comandaAlvo === null ? 'Confirmar: Abrir Nova Comanda' : 'Confirmar: Adicionar Itens à Comanda Selecionada'}
          </button>
        </>
      )}
    </div>
  );
}