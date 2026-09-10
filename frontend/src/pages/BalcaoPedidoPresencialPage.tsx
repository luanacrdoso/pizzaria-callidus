import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarMesas } from '../api/mesas';
import { buscarPizzas, buscarPizzaPorId } from '../api/pizzas';
import { buscarAdicionais } from '../api/adicionais';
import { buscarCategorias } from '../api/categorias';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
import { calcularPrecoPizzaMultiplosSabores } from '../api/precos';

const TAMANHOS = [
  { chave: 'brotinho', rotulo: 'Brotinho' },
  { chave: 'media', rotulo: 'Média' },
  { chave: 'grande', rotulo: 'Grande' },
];

async function buscarCardapioComoAny(): Promise<any[]> {
  const pizzas = await buscarPizzas();
  return pizzas as any[];
}

export function BalcaoPedidoPresencialPage() {
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
  const { data: cardapio } = useQuery<any[]>({ queryKey: ['pizzas'], queryFn: buscarCardapioComoAny });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const [tipoEntrega, setTipoEntrega] = useState<'presencial' | 'retirada'>('presencial');
  const [mesaId, setMesaId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');

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
    setDetalhe(null);
    setSaboresSelecionados([]);
    setEscolhasCombo({});
    setTamanho('media');
    if (produtoId) buscarPizzaPorId(Number(produtoId)).then(setDetalhe);
  }, [produtoId]);

  const limparFormularioItem = () => {
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
      const nomeSabores = saboresObjetos.map((s) => s.nome).join(' / ');
      return { nome: `${produto.nome}: ${nomeSabores}`, precoUnitario: precoBase + precoExtras };
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

  const adicionarItem = () => {
    const resultado = montarNomeEPreco();
    if (!resultado || !produto) { setErro('Complete todas as escolhas do item antes de adicionar.'); return; }
    setErro('');
    setItens([...itens, {
      pizzaId: produto.id, nome: resultado.nome, tamanho: produto.tipo === 'combo' ? '-' : tamanho,
      extras: extrasSelecionados.map((e) => e.nome), observacoes, quantidade, precoUnitario: resultado.precoUnitario,
    }]);
    limparFormularioItem();
  };

  const removerItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const nomeCategoria = (id: number) => categorias?.find((c: any) => c.id === id)?.nome ?? '';

  const handleFinalizar = async () => {
    if (itens.length === 0) return;
    if (tipoEntrega === 'presencial' && !mesaId) { setErro('Selecione a mesa.'); return; }
    setErro(''); setSucesso('');
    try {
      const pedido = await criarPedidoPresencial({
        tipo: tipoEntrega,
        mesa_id: tipoEntrega === 'presencial' ? Number(mesaId) : null,
        cliente_nome: tipoEntrega === 'presencial'
          ? `Mesa ${mesas?.find((m: any) => m.id === Number(mesaId))?.numero ?? ''}`
          : (nomeCliente || 'Retirada balcão'),
        cliente_telefone: telefoneCliente,
        itens, subtotal, taxa_entrega: 0, total: subtotal,
        forma_pagamento: 'A definir',
      });
      setSucesso(`Pedido #${pedido.id} lançado com sucesso!`);
      setItens([]); setMesaId(''); setNomeCliente(''); setTelefoneCliente('');
    } catch (e: any) {
      setErro(e.message);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1>Anotar Pedido</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setTipoEntrega('presencial')} disabled={tipoEntrega === 'presencial'}>Mesa (comer no local)</button>
        <button onClick={() => setTipoEntrega('retirada')} disabled={tipoEntrega === 'retirada'}>Retirada no balcão</button>
      </div>

      {tipoEntrega === 'presencial' ? (
        <select value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
          <option value="">Selecione a mesa</option>
          {mesas?.map((m: any) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
        </select>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Nome do cliente" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
          <input placeholder="Telefone" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} />
        </div>
      )}

      <hr style={{ margin: '16px 0' }} />

      <h2>Adicionar item</h2>
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
          <button onClick={adicionarItem} style={{ marginTop: 8 }}>Adicionar ao pedido</button>
        </>
      )}

      <hr style={{ margin: '16px 0' }} />

      <h2>Itens do pedido</h2>
      {itens.length === 0 && <p>Nenhum item ainda.</p>}
      <ul>
        {itens.map((i, idx) => (
          <li key={idx}>
            {i.quantidade}x {i.nome} {i.tamanho !== '-' && `(${i.tamanho})`}
            {i.extras.length > 0 && ` + ${i.extras.join(', ')}`}
            {' — R$ '}{(i.precoUnitario * i.quantidade).toFixed(2)}
            <button onClick={() => removerItem(idx)} style={{ marginLeft: 8 }}>Remover</button>
          </li>
        ))}
      </ul>
      <p><strong>Total: R$ {subtotal.toFixed(2)}</strong></p>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {sucesso && <p style={{ color: 'green' }}>{sucesso}</p>}
      <button onClick={handleFinalizar} disabled={itens.length === 0}>Lançar Pedido</button>
    </div>
  );
}