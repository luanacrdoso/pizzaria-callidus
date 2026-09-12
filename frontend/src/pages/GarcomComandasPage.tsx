import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { buscarMesas } from '../api/mesas';
import { buscarPizzas, buscarPizzaPorId } from '../api/pizzas';
import { buscarAdicionais } from '../api/adicionais';
import { buscarCategorias } from '../api/categorias';
import { buscarComandas, adicionarItemAoPedido, registrarPagamento } from '../api/comandas';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
import { fetchComoFuncionario, obterUsernameFuncionario } from '../api/funcionarioAuth';
import { calcularPrecoPizzaMultiplosSabores } from '../api/precos';

async function buscarCardapioComoAny(): Promise<any[]> {
  const pizzas = await buscarPizzas();
  return pizzas as any[];
}

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
    queryKey: ['comandas', mesaId],
    queryFn: () => buscarComandas(Number(mesaId)),
    enabled: !!mesaId,
    refetchInterval: 5000,
  });

  const invalidarComandas = () => {
    queryClient.invalidateQueries({ queryKey: ['comandas', mesaId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-garcom'] });
  };

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
    setDetalhe(null);
    setSaboresSelecionados([]);
    setEscolhasCombo({});
    setTamanho('media');
    if (produtoId) buscarPizzaPorId(Number(produtoId)).then(setDetalhe);
  }, [produtoId]);

  const limparItemAtual = () => {
    setProdutoId('');
    setDetalhe(null);
    setTamanho('media');
    setSaboresSelecionados([]);
    setExtrasSelecionados([]);
    setEscolhasCombo({});
    setQuantidade(1);
    setObservacoes('');
  };

  const toggleExtra = (a: any) => {
    const jaTem = extrasSelecionados.some((e) => e.nome === a.nome);
    setExtrasSelecionados(
      jaTem
        ? extrasSelecionados.filter((e) => e.nome !== a.nome)
        : [...extrasSelecionados, { nome: a.nome, preco: Number(a.preco) }]
    );
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
      return {
        nome: produto.nome,
        precoUnitario: Number(produto[`preco_${tamanho}`] ?? 0) + precoExtras,
      };
    }
    if (produto.tipo === 'personalizavel') {
      if (saboresSelecionados.length === 0) return null;
      const saboresObjetos = saboresSelecionados
        .map((id) => cardapio?.find((p: any) => p.id === id))
        .filter(Boolean) as any[];
      const precos = saboresObjetos.map((s) => Number(s[`preco_${tamanho}`] ?? 0));
      const precoBase = calcularPrecoPizzaMultiplosSabores(precos);
      return {
        nome: `${produto.nome}: ${saboresObjetos.map((s) => s.nome).join(' / ')}`,
        precoUnitario: precoBase + precoExtras,
      };
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
      return {
        nome: `${produto.nome} (${nomesEscolhidos.join(', ')})`,
        precoUnitario: Number(produto.preco_combo ?? 0) + precoExtras,
      };
    }
    return null;
  };

  const handleAdicionarItemNaLista = () => {
    const resultado = montarNomeEPreco();
    if (!resultado || !produto) {
      setErro('Complete todas as escolhas do item antes de adicionar.');
      return;
    }
    setErro('');
    setItens([
      ...itens,
      {
        pizzaId: produto.id,
        nome: resultado.nome,
        tamanho: produto.tipo === 'combo' ? '-' : tamanho,
        extras: extrasSelecionados.map((e) => e.nome),
        observacoes,
        quantidade,
        precoUnitario: resultado.precoUnitario,
      },
    ]);
    limparItemAtual();
  };

  const removerItemDaLista = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const subtotalNovosItens = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);

  const handleConfirmarComanda = async () => {
    if (itens.length === 0) {
      setErro('Adicione pelo menos um item antes de confirmar.');
      return;
    }
    setErro('');
    setSucesso('');

    try {
      if (comandaAlvo === null) {
        if (!novaComandaNome) {
          setErro('Digite o nome do responsável pela nova comanda.');
          return;
        }
        const gorjeta = incluirGorjeta ? Number((subtotalNovosItens * 0.1).toFixed(2)) : 0;
        await criarPedidoPresencial({
          tipo: 'presencial',
          mesa_id: Number(mesaId),
          comanda_nome: novaComandaNome,
          garcom_username: obterUsernameFuncionario(),
          cliente_nome: novaComandaNome,
          itens,
          subtotal: subtotalNovosItens,
          taxa_entrega: 0,
          total: subtotalNovosItens + gorjeta,
          gorjeta_valor: gorjeta,
          forma_pagamento: 'A definir',
        });
        setSucesso(`Comanda "${novaComandaNome}" aberta com sucesso!`);
        setNovaComandaNome('');
        setIncluirGorjeta(false);
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
    try {
      await registrarPagamento(pedidoId, {
        nome_pagador: nomePagador,
        valor_pago: total,
        forma_pagamento: 'Dinheiro',
      });
      const resposta = await fetchComoFuncionario(
        `${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'finalizado' }),
        }
      );
      if (!resposta.ok) {
        const err = await resposta.json();
        alert('Erro ao fechar comanda: ' + (err.mensagem || 'Erro desconhecido'));
        return;
      }
      invalidarComandas();
    } catch (e: any) {
      alert('Erro ao fechar comanda: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1>🍽️ Gestão de Comandas</h1>

      {/* PASSO 1: MESA */}
      <div className="secao-checkout">
        <h3>Passo 1 — Selecione a Mesa</h3>
        <select
          value={mesaId}
          onChange={(e) => {
            setMesaId(e.target.value);
            setComandaAlvo(null);
          }}
          style={{ width: '100%' }}
        >
          <option value="">Clique para escolher a mesa...</option>
          {mesas?.map((m: any) => (
            <option key={m.id} value={m.id}>
              Mesa {m.numero}
            </option>
          ))}
        </select>
      </div>

      {mesaId && (
        <>
          {/* PASSO 2: COMANDAS ABERTAS COM DETALHAMENTO DE ITENS */}
          <div className="secao-checkout">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Passo 2 — Comandas Abertas na Mesa {mesaId}</h3>
              <button
                onClick={() => setComandaAlvo(null)}
                className={comandaAlvo === null ? '' : 'btn-secundario'}
                style={{ fontSize: '0.85rem' }}
              >
                {comandaAlvo === null ? '● Criando nova comanda' : '+ Nova Comanda'}
              </button>
            </div>

            {(!comandas || comandas.length === 0) && (
              <p className="subtext" style={{ padding: '12px 0' }}>
                Nenhuma comanda aberta nesta mesa no momento.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {comandas?.map((c: any) => {
                const selecionada = comandaAlvo === c.id;
                const listaItens = c.itens ?? [];

                return (
                  <div
                    key={c.id}
                    className={`card-simples ${selecionada ? 'card-destaque' : ''}`}
                    style={{ padding: 16 }}
                  >
                    {/* Cabeçalho da Comanda */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <strong>👤 {c.comanda_nome}</strong>
                        {c.criado_em && (
                          <span className="subtext" style={{ marginLeft: 8 }}>
                            🕒 {new Date(c.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className={`status-badge status-${c.status}`}>
                        {c.status}
                      </span>
                    </div>

                    <hr style={{ margin: '8px 0' }} />

                    {/* Detalhamento dos Itens do Pedido */}
                    <div style={{ margin: '10px 0' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Itens na comanda:</strong>
                      {listaItens.length === 0 ? (
                        <p className="subtext" style={{ fontStyle: 'italic', marginTop: 4 }}>Nenhum item registrado.</p>
                      ) : (
                        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '8px 0 0' }}>
                          {listaItens.map((item: any, idx: number) => (
                            <li
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 6,
                                paddingBottom: 6,
                                borderBottom: '1px dashed var(--border-soft)',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600 }}>
                                  {item.quantidade}x {item.nome}
                                </span>{' '}
                                {item.tamanho && item.tamanho !== '-' && (
                                  <span className="subtext">({item.tamanho})</span>
                                )}
                                {item.extras && (
                                  <div className="subtext" style={{ fontSize: '0.8rem', color: 'var(--gold-dark)' }}>
                                    + {Array.isArray(item.extras) ? item.extras.join(', ') : item.extras}
                                  </div>
                                )}
                                {item.observacoes && (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                                    Obs: {item.observacoes}
                                  </div>
                                )}
                              </div>
                              <strong style={{ fontSize: '0.9rem' }}>
                                R$ {(Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 1)).toFixed(2)}
                              </strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Rodapé da Comanda com Total e Ações */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <div>
                        <span className="subtext">Total Acumulado: </span>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--gold-dark)' }}>
                          R$ {Number(c.total).toFixed(2)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setComandaAlvo(c.id)}
                          disabled={selecionada}
                          className={selecionada ? '' : 'btn-secundario'}
                          style={{ fontSize: '0.82rem' }}
                        >
                          {selecionada ? '✓ Selecionada' : '+ Lançar Itens'}
                        </button>
                        <button
                          onClick={() => handleFecharComanda(c.id, c.total, c.comanda_nome)}
                          style={{ fontSize: '0.82rem', background: 'var(--success)' }}
                        >
                          Fechar e Pagar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {comandaAlvo === null && (
              <div style={{ padding: 16, background: 'var(--cream-2)', borderRadius: 'var(--radius-sm)' }}>
                <label className="campo-label" style={{ display: 'block', marginBottom: 6 }}>
                  Nome do Responsável pela Nova Comanda:
                </label>
                <input
                  value={novaComandaNome}
                  onChange={(e) => setNovaComandaNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  style={{ width: '100%', marginBottom: 10 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={incluirGorjeta}
                    onChange={(e) => setIncluirGorjeta(e.target.checked)}
                  />
                  Incluir 10% de gorjeta do garçom
                </label>
              </div>
            )}
          </div>

          {/* PASSO 3: MONTAGEM DO NOVO ITEM */}
          <div className="secao-checkout">
            <h3>Passo 3 — Monte os Itens para Lançar</h3>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              style={{ width: '100%', marginBottom: 12 }}
            >
              <option value="">Escolha um produto do cardápio...</option>
              {cardapio?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.categoria})
                </option>
              ))}
            </select>

            {produto && produto.tipo === 'sabor_unico' && (
              <div className="opcoes-grid" style={{ marginBottom: 12 }}>
                {TAMANHOS.filter((t) => produto[`preco_${t.chave}`]).map((t) => (
                  <label key={t.chave} className={`opcao-card ${tamanho === t.chave ? 'selecionada' : ''}`}>
                    <input type="radio" checked={tamanho === t.chave} onChange={() => setTamanho(t.chave)} />
                    {t.rotulo} (R$ {Number(produto[`preco_${t.chave}`]).toFixed(2)})
                  </label>
                ))}
              </div>
            )}

            {produto && produto.tipo === 'personalizavel' && detalhe && (
              <div style={{ marginBottom: 12 }}>
                <label className="campo-label">Tamanho:</label>
                <div className="opcoes-grid" style={{ marginBottom: 12 }}>
                  {TAMANHOS.filter((t) => produto[`preco_${t.chave}`]).map((t) => (
                    <label key={t.chave} className={`opcao-card ${tamanho === t.chave ? 'selecionada' : ''}`}>
                      <input
                        type="radio"
                        checked={tamanho === t.chave}
                        onChange={() => {
                          setTamanho(t.chave);
                          setSaboresSelecionados([]);
                        }}
                      />
                      {t.rotulo}
                    </label>
                  ))}
                </div>

                <label className="campo-label">
                  Escolha até {detalhe[`max_sabores_${tamanho}`] ?? '—'} sabores:
                </label>
                <div className="opcoes-grid">
                  {(detalhe.sabores_permitidos ?? []).map((saborId: number) => {
                    const sabor = cardapio?.find((p: any) => p.id === saborId);
                    if (!sabor) return null;
                    return (
                      <label
                        key={saborId}
                        className={`opcao-card ${saboresSelecionados.includes(saborId) ? 'selecionada' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={saboresSelecionados.includes(saborId)}
                          onChange={() => toggleSabor(saborId)}
                        />
                        {sabor.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {produto && produto.tipo === 'combo' && detalhe && (
              <div style={{ marginBottom: 12 }}>
                <strong>Combo: R$ {Number(produto.preco_combo ?? 0).toFixed(2)}</strong>
                {(detalhe.combo_slots ?? []).map((slot: any, slotIndex: number) => (
                  <div key={slotIndex} style={{ marginTop: 8 }}>
                    <label className="campo-label">{slot.rotulo || nomeCategoria(slot.categoria_id)}</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Array.from({ length: slot.quantidade }).map((_, pos) => (
                        <select
                          key={pos}
                          value={escolhasCombo[slotIndex]?.[pos] ?? ''}
                          onChange={(e) => atualizarEscolhaCombo(slotIndex, pos, e.target.value)}
                        >
                          <option value="">Opção {pos + 1}</option>
                          {cardapio
                            ?.filter((p: any) => p.categoria_id === slot.categoria_id && p.tipo !== 'combo')
                            .map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.nome}
                              </option>
                            ))}
                        </select>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {produto && (
              <>
                {(adicionais?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <label className="campo-label">Adicionais:</label>
                    <div className="opcoes-grid">
                      {adicionais?.map((a: any) => (
                        <label
                          key={a.id}
                          className={`opcao-card ${extrasSelecionados.some((e) => e.nome === a.nome) ? 'selecionada' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={extrasSelecionados.some((e) => e.nome === a.nome)}
                            onChange={() => toggleExtra(a)}
                          />
                          {a.nome} (+R$ {Number(a.preco).toFixed(2)})
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  placeholder="Observações do item (ex: sem cebola)..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  style={{ width: '100%', marginTop: 12 }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div className="stepper-qtd">
                    <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>-</button>
                    <span>{quantidade}</span>
                    <button onClick={() => setQuantidade(quantidade + 1)}>+</button>
                  </div>

                  <button onClick={handleAdicionarItemNaLista}>+ Inserir na Lista</button>
                </div>
              </>
            )}
          </div>

          {/* PASSO 4: RESUMO DOS ITENS A ENVIAR */}
          <div className="secao-checkout">
            <h3>Passo 4 — Resumo dos Novos Itens</h3>
            {itens.length === 0 && <p className="subtext">Nenhum item adicionado à lista ainda.</p>}

            <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: 16 }}>
              {itens.map((i, idx) => (
                <li
                  key={idx}
                  className="card-simples"
                  style={{ padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong>{i.quantidade}x {i.nome}</strong> {i.tamanho !== '-' && `(${i.tamanho})`}
                    {i.extras.length > 0 && <div className="subtext">+ {i.extras.join(', ')}</div>}
                    {i.observacoes && <div className="subtext" style={{ color: 'var(--danger)' }}>Obs: {i.observacoes}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong>R$ {(i.precoUnitario * i.quantidade).toFixed(2)}</strong>
                    <button onClick={() => removerItemDaLista(idx)} className="btn-link" style={{ color: 'var(--danger)' }}>
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {itens.length > 0 && (
              <div className="resumo-linha total" style={{ marginBottom: 16 }}>
                <span>Subtotal destes itens:</span>
                <span>R$ {subtotalNovosItens.toFixed(2)}</span>
              </div>
            )}

            {erro && <div className="mensagem-erro-box" style={{ marginBottom: 12, padding: 10 }}>{erro}</div>}
            {sucesso && <div className="mensagem-sucesso-box" style={{ marginBottom: 12, padding: 10 }}>{sucesso}</div>}

            <button onClick={handleConfirmarComanda} disabled={itens.length === 0} className="cta-fixo">
              {comandaAlvo === null ? '✓ Confirmar e Abrir Nova Comanda' : '✓ Enviar Itens para a Comanda Selecionada'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}