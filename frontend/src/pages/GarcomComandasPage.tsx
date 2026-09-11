import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { buscarMesas } from '../api/mesas';
import { buscarPizzas, buscarPizzaPorId } from '../api/pizzas';
import { buscarAdicionais } from '../api/adicionais';
import { buscarCategorias } from '../api/categorias';
import { buscarComandas, adicionarItemAoPedido, registrarPagamento } from '../api/comandas';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
import { fetchComoFuncionario, obterUsernameFuncionario } from '../api/funcionarioAuth';
import { calcularPrecoPizzaMultiplosSabores } from '../api/precos';

type ItemNovo = { nome: string; tamanho: string; extras: string[]; observacoes?: string | null; quantidade: number; precoUnitario: number; pizzaId?: number | null };
type Mesa = { id: number; numero: number };
type Comanda = { id: number; comanda_nome: string; total: number };
type Produto = { id: number; nome: string; categoria?: string; categoria_id?: number; tipo: string; preco_brotinho?: number; preco_media?: number; preco_grande?: number; preco_combo?: number };
type Adicional = { id: number; nome: string; preco: number };
type Categoria = { id: number; nome: string };
type Slot = { rotulo?: string; categoria_id: number; quantidade: number };
type Detalhe = { max_sabores_brotinho?: number; max_sabores_media?: number; max_sabores_grande?: number; sabores_permitidos?: number[]; combo_slots?: Slot[] };

const TAMANHOS = ['brotinho', 'media', 'grande'] as const;
type Tamanho = typeof TAMANHOS[number];

export function GarcomComandasPage() {
  const queryClient = useQueryClient();

  const { data: mesasData } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
  const { data: cardapioData } = useQuery({ queryKey: ['pizzas'], queryFn: buscarPizzas });
  const { data: adicionaisData } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categoriasData } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const mesas = (mesasData ?? []) as unknown as Mesa[];
  const cardapio = (cardapioData ?? []) as unknown as Produto[];
  const adicionais = (adicionaisData ?? []) as unknown as Adicional[];
  const categorias = (categoriasData ?? []) as unknown as Categoria[];

  const [mesaId, setMesaId] = useState('');
  const { data: comandasData } = useQuery({
    queryKey: ['comandas', mesaId],
    queryFn: () => buscarComandas(Number(mesaId)),
    enabled: !!mesaId
  });
  const comandas = (comandasData ?? []) as unknown as Comanda[];

  const [novaComandaNome, setNovaComandaNome] = useState('');
  const [incluirGorjeta, setIncluirGorjeta] = useState(false);
  const [itensNovos, setItensNovos] = useState<ItemNovo[]>([]);
  const [produtoId, setProdutoId] = useState('');
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [tamanho, setTamanho] = useState<Tamanho>('media');
  const [sabores, setSabores] = useState<number[]>([]);
  const [extras, setExtras] = useState<{ nome: string; preco: number }[]>([]);
  const [combo, setCombo] = useState<Record<number, string[]>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');

  const produto = cardapio.find(p => String(p.id) === produtoId);
  const preco = (p: Produto, t: Tamanho) => Number(p[`preco_${t}` as keyof Produto] ?? 0);

  const trocarProduto = async (id: string) => {
    setProdutoId(id); setDetalhe(null); setSabores([]); setCombo({}); setTamanho('media');
    if (id) setDetalhe(await buscarPizzaPorId(Number(id)) as unknown as Detalhe);
  };

  const toggleExtra = (a: Adicional) =>
    setExtras(extras.some(e => e.nome === a.nome)
      ? extras.filter(e => e.nome !== a.nome)
      : [...extras, { nome: a.nome, preco: Number(a.preco) }]);

  const toggleSabor = (id: number) => {
    const max = Number(detalhe?.[`max_sabores_${tamanho}` as keyof Detalhe] ?? 99);
    setSabores(atual => atual.includes(id)
      ? atual.filter(s => s !== id)
      : atual.length < max ? [...atual, id] : atual);
  };

  const atualizarCombo = (slot: number, pos: number, id: string) =>
    setCombo(atual => {
      const nova = [...(atual[slot] ?? [])];
      nova[pos] = id;
      return { ...atual, [slot]: nova };
    });

  const montarItem = () => {
    if (!produto) return;
    const precoExtras = extras.reduce((s, e) => s + e.preco, 0);
    let nome = produto.nome;
    let precoUnitario = preco(produto, tamanho);

    if (produto.tipo === 'personalizavel') {
      const escolhidos = sabores.map(id => cardapio.find(p => p.id === id)).filter((p): p is Produto => !!p);
      if (!escolhidos.length) return;
      nome += `: ${escolhidos.map(p => p.nome).join(' / ')}`;
      precoUnitario = calcularPrecoPizzaMultiplosSabores(escolhidos.map(p => preco(p, tamanho)));
    }

    if (produto.tipo === 'combo') {
      const nomes: string[] = [];
      for (let s = 0; s < (detalhe?.combo_slots ?? []).length; s++) {
        const slot = detalhe!.combo_slots![s];
        for (let p = 0; p < slot.quantidade; p++) {
          const id = combo[s]?.[p];
          if (!id) return;
          const item = cardapio.find(x => String(x.id) === id);
          if (item) nomes.push(item.nome);
        }
      }
      nome += ` (${nomes.join(', ')})`;
      precoUnitario = Number(produto.preco_combo ?? 0);
    }

    setItensNovos([...itensNovos, {
      pizzaId: produto.id, nome, tamanho: produto.tipo === 'combo' ? '-' : tamanho,
      extras: extras.map(e => e.nome), observacoes, quantidade, precoUnitario: precoUnitario + precoExtras
    }]);

    setProdutoId(''); setDetalhe(null); setSabores([]); setExtras([]);
    setCombo({}); setQuantidade(1); setObservacoes('');
  };

  const invalidarComandas = () => queryClient.invalidateQueries({ queryKey: ['comandas', mesaId] });

  const handleAbrirComanda = async () => {
    if (!novaComandaNome || !itensNovos.length) return;
    const subtotal = itensNovos.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
    const gorjeta = incluirGorjeta ? Number((subtotal * 0.10).toFixed(2)) : 0;

    await criarPedidoPresencial({
      tipo: 'presencial', mesa_id: Number(mesaId), comanda_nome: novaComandaNome,
      garcom_username: obterUsernameFuncionario(), cliente_nome: novaComandaNome,
      itens: itensNovos, subtotal, taxa_entrega: 0, total: subtotal + gorjeta,
      gorjeta_valor: gorjeta, forma_pagamento: 'A definir'
    });

    setNovaComandaNome(''); setItensNovos([]); setIncluirGorjeta(false); invalidarComandas();
  };

  const handleAdicionarNaComanda = async (id: number) => {
    for (const item of itensNovos) await adicionarItemAoPedido(id, item);
    setItensNovos([]); invalidarComandas();
  };

  const handleFecharComanda = async (id: number, total: number, nome: string) => {
    await registrarPagamento(id, { nome_pagador: nome, valor_pago: total, forma_pagamento: 'Dinheiro' });
    await fetchComoFuncionario(`${import.meta.env.VITE_API_URL}/pedidos/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finalizado' })
    });
    invalidarComandas();
  };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Comandas</h1>

      <select value={mesaId} onChange={e => setMesaId(e.target.value)}>
        <option value="">Selecione a mesa</option>
        {mesas.map(m => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
      </select>

      {mesaId && <>
        <h2>Comandas abertas nesta mesa</h2>
        {!comandas.length && <p>Nenhuma comanda aberta ainda.</p>}

        <ul>
          {comandas.map(c => <li key={c.id}>
            <strong>{c.comanda_nome}</strong> — R$ {c.total}
            <button onClick={() => handleAdicionarNaComanda(c.id)} disabled={!itensNovos.length}>Adicionar itens</button>
            <button onClick={() => handleFecharComanda(c.id, c.total, c.comanda_nome)}>Fechar e pagar</button>
          </li>)}
        </ul>

        <h2>Montar itens</h2>

        <select value={produtoId} onChange={e => trocarProduto(e.target.value)}>
          <option value="">Selecione um produto</option>
          {cardapio.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>

        {produto && produto.tipo !== 'combo' &&
          TAMANHOS.filter(t => preco(produto, t) > 0).map(t =>
            <label key={t}><input type="radio" checked={tamanho === t} onChange={() => setTamanho(t)} /> {t}</label>
          )}

        {produto?.tipo === 'personalizavel' && detalhe &&
          (detalhe.sabores_permitidos ?? []).map(id => {
            const sabor = cardapio.find(p => p.id === id);
            return sabor && <label key={id}>
              <input type="checkbox" checked={sabores.includes(id)} onChange={() => toggleSabor(id)} /> {sabor.nome}
            </label>;
          })}

        {produto?.tipo === 'combo' && detalhe?.combo_slots?.map((slot, s) =>
          <div key={s}>
            <p>{slot.rotulo || categorias.find(c => c.id === slot.categoria_id)?.nome}</p>
            {Array.from({ length: slot.quantidade }).map((_, pos) =>
              <select key={pos} value={combo[s]?.[pos] ?? ''} onChange={e => atualizarCombo(s, pos, e.target.value)}>
                <option value="">Escolha</option>
                {cardapio.filter(p => p.categoria_id === slot.categoria_id && p.tipo !== 'combo')
                  .map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            )}
          </div>)}

        {produto && adicionais.map(a =>
          <label key={a.id}><input type="checkbox" checked={extras.some(e => e.nome === a.nome)} onChange={() => toggleExtra(a)} /> {a.nome}</label>
        )}

        {produto && <>
          <textarea placeholder="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          <input type="number" min={1} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} />
          <button onClick={montarItem}>Adicionar item</button>
        </>}

        <ul>
          {itensNovos.map((i, idx) => <li key={idx}>{i.quantidade}x {i.nome}</li>)}
        </ul>

        <h2>Abrir nova comanda</h2>
        <input placeholder="Nome do responsável" value={novaComandaNome} onChange={e => setNovaComandaNome(e.target.value)} />

        <label>
          <input type="checkbox" checked={incluirGorjeta} onChange={e => setIncluirGorjeta(e.target.checked)} />
          {' '}Incluir gorjeta de 10%
        </label>

        <button onClick={handleAbrirComanda} disabled={!novaComandaNome || !itensNovos.length}>
          Abrir Comanda
        </button>
      </>}
    </div>
  );
}