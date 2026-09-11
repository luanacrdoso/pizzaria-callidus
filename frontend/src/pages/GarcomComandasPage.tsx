import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { buscarMesas } from '../api/mesas';
import { buscarPizzas, buscarPizzaPorId } from '../api/pizzas';
import { buscarAdicionais } from '../api/adicionais';
import { buscarCategorias } from '../api/categorias';
import {
  buscarComandas,
  adicionarItemAoPedido,
  registrarPagamento
} from '../api/comandas';
import { criarPedidoPresencial } from '../api/pedidosEquipe';
import {
  fetchComoFuncionario,
  obterUsernameFuncionario
} from '../api/funcionarioAuth';
import { calcularPrecoPizzaMultiplosSabores } from '../api/precos';

const TAMANHOS = [
  { chave: 'brotinho', rotulo: 'Brotinho' },
  { chave: 'media', rotulo: 'Média' },
  { chave: 'grande', rotulo: 'Grande' },
] as const;

type Tamanho = 'brotinho' | 'media' | 'grande';

type ItemNovo = {
  nome: string;
  tamanho: string;
  extras: string[];
  observacoes?: string | null;
  quantidade: number;
  precoUnitario: number;
  pizzaId?: number | null;
};

type Mesa = {
  id: number;
  numero: number;
};

type Comanda = {
  id: number;
  comanda_nome: string;
  total: number;
};

type Produto = {
  id: number;
  nome: string;
  categoria?: string;
  categoria_id?: number;
  tipo: 'sabor_unico' | 'personalizavel' | 'combo';
  preco_brotinho?: number | string | null;
  preco_media?: number | string | null;
  preco_grande?: number | string | null;
  preco_combo?: number | string | null;
};

type Adicional = {
  id: number;
  nome: string;
  preco: number | string;
};

type Categoria = {
  id: number;
  nome: string;
};

type ComboSlot = {
  rotulo?: string;
  categoria_id: number;
  quantidade: number;
};

type DetalheProduto = {
  max_sabores_brotinho?: number;
  max_sabores_media?: number;
  max_sabores_grande?: number;
  sabores_permitidos?: number[];
  combo_slots?: ComboSlot[];
};

function precoProduto(produto: Produto, tamanho: Tamanho) {
  if (tamanho === 'brotinho') return produto.preco_brotinho;
  if (tamanho === 'grande') return produto.preco_grande;

  return produto.preco_media;
}

function maxSabores(
  detalhe: DetalheProduto | null,
  tamanho: Tamanho
) {
  if (!detalhe) return undefined;

  if (tamanho === 'brotinho') {
    return detalhe.max_sabores_brotinho;
  }

  if (tamanho === 'grande') {
    return detalhe.max_sabores_grande;
  }

  return detalhe.max_sabores_media;
}

export function GarcomComandasPage() {
  const queryClient = useQueryClient();

  const { data: mesasData } = useQuery({
    queryKey: ['mesas'],
    queryFn: buscarMesas
  });

  const { data: cardapioData } = useQuery({
    queryKey: ['pizzas'],
    queryFn: buscarPizzas
  });

  const { data: adicionaisData } = useQuery({
    queryKey: ['adicionais'],
    queryFn: buscarAdicionais
  });

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: buscarCategorias
  });

  const mesas = (mesasData ?? []) as unknown as Mesa[];
  const cardapio = (cardapioData ?? []) as unknown as Produto[];
  const adicionais = (adicionaisData ?? []) as unknown as Adicional[];
  const categorias = (categoriasData ?? []) as unknown as Categoria[];

  const [mesaId, setMesaId] = useState('');

  const { data: comandasData } = useQuery({
    queryKey: ['comandas', mesaId],
    queryFn: () => buscarComandas(Number(mesaId)),
    enabled: !!mesaId,
  });

  const comandas = (comandasData ?? []) as unknown as Comanda[];

  const [novaComandaNome, setNovaComandaNome] = useState('');
  const [incluirGorjeta, setIncluirGorjeta] = useState(false);
  const [itensNovos, setItensNovos] = useState<ItemNovo[]>([]);
  const [erro, setErro] = useState('');

  const [produtoId, setProdutoId] = useState('');
  const [detalhe, setDetalhe] =
    useState<DetalheProduto | null>(null);

  const [tamanho, setTamanho] =
    useState<Tamanho>('media');

  const [saboresSelecionados, setSaboresSelecionados] =
    useState<number[]>([]);

  const [extrasSelecionados, setExtrasSelecionados] =
    useState<{ nome: string; preco: number }[]>([]);

  const [escolhasCombo, setEscolhasCombo] =
    useState<Record<number, string[]>>({});

  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');

  const produto = cardapio.find(
    (p) => String(p.id) === produtoId
  );

  const handleProdutoChange = async (id: string) => {
    setProdutoId(id);
    setDetalhe(null);
    setSaboresSelecionados([]);
    setEscolhasCombo({});
    setTamanho('media');

    if (id) {
      const dados = await buscarPizzaPorId(Number(id));

      setDetalhe(
        dados as unknown as DetalheProduto
      );
    }
  };

  const limparFormularioItem = () => {
    setProdutoId('');
    setDetalhe(null);
    setTamanho('media');
    setSaboresSelecionados([]);
    setExtrasSelecionados([]);
    setEscolhasCombo({});
    setQuantidade(1);
    setObservacoes('');
  };

  const toggleExtra = (a: Adicional) => {
    const jaTem = extrasSelecionados.some(
      (e) => e.nome === a.nome
    );

    setExtrasSelecionados(
      jaTem
        ? extrasSelecionados.filter(
            (e) => e.nome !== a.nome
          )
        : [
            ...extrasSelecionados,
            {
              nome: a.nome,
              preco: Number(a.preco)
            }
          ]
    );
  };

  const toggleSabor = (id: number) => {
    const max = Number(
      maxSabores(detalhe, tamanho) ?? 99
    );

    setSaboresSelecionados((atual) => {
      if (atual.includes(id)) {
        return atual.filter(
          (s) => s !== id
        );
      }

      if (atual.length >= max) {
        return atual;
      }

      return [...atual, id];
    });
  };

  const atualizarEscolhaCombo = (
    slotIndex: number,
    posicao: number,
    pizzaId: string
  ) => {
    setEscolhasCombo((atual) => {
      const nova = [
        ...(atual[slotIndex] ?? [])
      ];

      nova[posicao] = pizzaId;

      return {
        ...atual,
        [slotIndex]: nova
      };
    });
  };

  const precoExtras = extrasSelecionados.reduce(
    (s, e) => s + e.preco,
    0
  );

  const montarNomeEPreco = (): {
    nome: string;
    precoUnitario: number;
  } | null => {
    if (!produto) return null;

    if (produto.tipo === 'sabor_unico') {
      return {
        nome: produto.nome,
        precoUnitario:
          Number(
            precoProduto(
              produto,
              tamanho
            ) ?? 0
          ) + precoExtras
      };
    }

    if (produto.tipo === 'personalizavel') {
      if (
        saboresSelecionados.length === 0
      ) {
        return null;
      }

      const saboresObjetos =
        saboresSelecionados
          .map((id) =>
            cardapio.find(
              (p) => p.id === id
            )
          )
          .filter(
            (p): p is Produto =>
              p !== undefined
          );

      const precos =
        saboresObjetos.map(
          (s) =>
            Number(
              precoProduto(
                s,
                tamanho
              ) ?? 0
            )
        );

      const precoBase =
        calcularPrecoPizzaMultiplosSabores(
          precos
        );

      const nomeSabores =
        saboresObjetos
          .map((s) => s.nome)
          .join(' / ');

      return {
        nome: `${produto.nome}: ${nomeSabores}`,
        precoUnitario:
          precoBase + precoExtras
      };
    }

    if (produto.tipo === 'combo') {
      const slots =
        detalhe?.combo_slots ?? [];

      const nomesEscolhidos: string[] =
        [];

      for (
        let i = 0;
        i < slots.length;
        i++
      ) {
        const escolhas =
          escolhasCombo[i] ?? [];

        for (
          let pos = 0;
          pos < slots[i].quantidade;
          pos++
        ) {
          const idEscolhido =
            escolhas[pos];

          if (!idEscolhido) {
            return null;
          }

          const item =
            cardapio.find(
              (p) =>
                String(p.id) ===
                idEscolhido
            );

          if (item) {
            nomesEscolhidos.push(
              item.nome
            );
          }
        }
      }

      return {
        nome:
          `${produto.nome} (` +
          `${nomesEscolhidos.join(', ')})`,

        precoUnitario:
          Number(
            produto.preco_combo ?? 0
          ) + precoExtras
      };
    }

    return null;
  };

  const adicionarItem = () => {
    const resultado =
      montarNomeEPreco();

    if (!resultado || !produto) {
      setErro(
        'Complete todas as escolhas do item antes de adicionar.'
      );

      return;
    }

    setErro('');

    setItensNovos([
      ...itensNovos,
      {
        pizzaId: produto.id,
        nome: resultado.nome,

        tamanho:
          produto.tipo === 'combo'
            ? '-'
            : tamanho,

        extras:
          extrasSelecionados.map(
            (e) => e.nome
          ),

        observacoes,
        quantidade,

        precoUnitario:
          resultado.precoUnitario,
      }
    ]);

    limparFormularioItem();
  };

  const removerItem = (i: number) => {
    setItensNovos(
      itensNovos.filter(
        (_, idx) => idx !== i
      )
    );
  };

  const nomeCategoria = (
    id: number
  ) =>
    categorias.find(
      (c) => c.id === id
    )?.nome ?? '';

  const invalidarComandas = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'comandas',
        mesaId
      ]
    });

  const handleAbrirComanda =
    async () => {
      if (
        !novaComandaNome ||
        itensNovos.length === 0
      ) {
        return;
      }

      const subtotal =
        itensNovos.reduce(
          (s, i) =>
            s +
            i.precoUnitario *
              i.quantidade,
          0
        );

      const gorjeta =
        incluirGorjeta
          ? Number(
              (
                subtotal * 0.10
              ).toFixed(2)
            )
          : 0;

      await criarPedidoPresencial({
        tipo: 'presencial',

        mesa_id:
          Number(mesaId),

        comanda_nome:
          novaComandaNome,

        garcom_username:
          obterUsernameFuncionario(),

        cliente_nome:
          novaComandaNome,

        itens: itensNovos,

        subtotal,

        taxa_entrega: 0,

        total:
          subtotal + gorjeta,

        gorjeta_valor:
          gorjeta,

        forma_pagamento:
          'A definir',
      });

      setNovaComandaNome('');
      setItensNovos([]);
      setIncluirGorjeta(false);

      invalidarComandas();
    };

  const handleAdicionarNaComanda =
    async (
      pedidoId: number
    ) => {
      for (
        const item of itensNovos
      ) {
        await adicionarItemAoPedido(
          pedidoId,
          item
        );
      }

      setItensNovos([]);

      invalidarComandas();
    };

  const handleFecharComanda =
    async (
      pedidoId: number,
      total: number,
      nomePagador: string
    ) => {
      await registrarPagamento(
        pedidoId,
        {
          nome_pagador:
            nomePagador,

          valor_pago:
            total,

          forma_pagamento:
            'Dinheiro'
        }
      );

      await fetchComoFuncionario(
        `${
          import.meta.env
            .VITE_API_URL
        }/pedidos/${pedidoId}/status`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            status:
              'finalizado'
          })
        }
      );

      invalidarComandas();
    };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 700
      }}
    >
      <h1>Comandas</h1>

      <select
        value={mesaId}
        onChange={(e) =>
          setMesaId(
            e.target.value
          )
        }
      >
        <option value="">
          Selecione a mesa
        </option>

        {mesas.map((m) => (
          <option
            key={m.id}
            value={m.id}
          >
            Mesa {m.numero}
          </option>
        ))}
      </select>

      {mesaId && (
        <>
          <h2>
            Comandas abertas nesta
            mesa
          </h2>

          {comandas.length ===
            0 && (
            <p>
              Nenhuma comanda aberta
              ainda.
            </p>
          )}

          <ul
            style={{
              listStyle: 'none',
              padding: 0
            }}
          >
            {comandas.map((c) => (
              <li
                key={c.id}
                style={{
                  marginBottom: 8,
                  padding: 8,
                  border:
                    '1px solid #ddd',
                  borderRadius: 6
                }}
              >
                <strong>
                  {c.comanda_nome}
                </strong>

                {' — R$ '}
                {c.total}

                <button
                  onClick={() =>
                    handleAdicionarNaComanda(
                      c.id
                    )
                  }
                  disabled={
                    itensNovos.length ===
                    0
                  }
                  style={{
                    marginLeft: 8
                  }}
                >
                  Adicionar itens
                  montados abaixo
                </button>

                <button
                  onClick={() =>
                    handleFecharComanda(
                      c.id,
                      c.total,
                      c.comanda_nome
                    )
                  }
                  style={{
                    marginLeft: 8
                  }}
                >
                  Fechar e pagar
                </button>
              </li>
            ))}
          </ul>

          <h2>
            Montar itens para nova
            comanda ou adicionar em
            uma existente
          </h2>

          <select
            value={produtoId}
            onChange={(e) =>
              handleProdutoChange(
                e.target.value
              )
            }
          >
            <option value="">
              Selecione um produto
            </option>

            {cardapio.map((p) => (
              <option
                key={p.id}
                value={p.id}
              >
                {p.nome}
                {p.categoria
                  ? ` (${p.categoria})`
                  : ''}
              </option>
            ))}
          </select>

          {produto &&
            produto.tipo ===
              'sabor_unico' && (
              <div
                style={{
                  marginTop: 8
                }}
              >
                {TAMANHOS
                  .filter((t) =>
                    precoProduto(
                      produto,
                      t.chave
                    )
                  )
                  .map((t) => (
                    <label
                      key={
                        t.chave
                      }
                      style={{
                        display:
                          'block'
                      }}
                    >
                      <input
                        type="radio"
                        checked={
                          tamanho ===
                          t.chave
                        }
                        onChange={() =>
                          setTamanho(
                            t.chave
                          )
                        }
                      />

                      {' '}
                      {t.rotulo}
                      {' — R$ '}

                      {Number(
                        precoProduto(
                          produto,
                          t.chave
                        ) ?? 0
                      ).toFixed(2)}
                    </label>
                  ))}
              </div>
            )}

          {produto &&
            produto.tipo ===
              'personalizavel' &&
            detalhe && (
              <div
                style={{
                  marginTop: 8
                }}
              >
                <p>Tamanho:</p>

                {TAMANHOS
                  .filter((t) =>
                    precoProduto(
                      produto,
                      t.chave
                    )
                  )
                  .map((t) => (
                    <label
                      key={
                        t.chave
                      }
                      style={{
                        display:
                          'inline-block',
                        marginRight:
                          12
                      }}
                    >
                      <input
                        type="radio"
                        checked={
                          tamanho ===
                          t.chave
                        }
                        onChange={() => {
                          setTamanho(
                            t.chave
                          );

                          setSaboresSelecionados(
                            []
                          );
                        }}
                      />

                      {' '}
                      {t.rotulo}
                    </label>
                  ))}

                <p>
                  Sabores (máx.{' '}
                  {maxSabores(
                    detalhe,
                    tamanho
                  ) ?? '—'}
                  ):
                </p>

                {(
                  detalhe
                    .sabores_permitidos ??
                  []
                ).map(
                  (saborId) => {
                    const sabor =
                      cardapio.find(
                        (p) =>
                          p.id ===
                          saborId
                      );

                    if (!sabor) {
                      return null;
                    }

                    return (
                      <label
                        key={
                          saborId
                        }
                        style={{
                          display:
                            'block'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={saboresSelecionados.includes(
                            saborId
                          )}
                          onChange={() =>
                            toggleSabor(
                              saborId
                            )
                          }
                        />

                        {' '}
                        {sabor.nome}
                        {' (R$ '}

                        {Number(
                          precoProduto(
                            sabor,
                            tamanho
                          ) ?? 0
                        ).toFixed(2)}

                        {' inteira)'}
                      </label>
                    );
                  }
                )}
              </div>
            )}

          {produto &&
            produto.tipo ===
              'combo' &&
            detalhe && (
              <div
                style={{
                  marginTop: 8
                }}
              >
                <p>
                  <strong>
                    Combo: R${' '}
                    {Number(
                      produto.preco_combo ??
                        0
                    ).toFixed(2)}
                  </strong>
                </p>

                {(
                  detalhe.combo_slots ??
                  []
                ).map(
                  (
                    slot,
                    slotIndex
                  ) => (
                    <div
                      key={
                        slotIndex
                      }
                      style={{
                        marginBottom:
                          8
                      }}
                    >
                      <p>
                        {slot.rotulo ||
                          nomeCategoria(
                            slot.categoria_id
                          )}
                      </p>

                      {Array.from({
                        length:
                          slot.quantidade
                      }).map(
                        (_, pos) => (
                          <select
                            key={
                              pos
                            }
                            value={
                              escolhasCombo[
                                slotIndex
                              ]?.[
                                pos
                              ] ?? ''
                            }
                            onChange={(
                              e
                            ) =>
                              atualizarEscolhaCombo(
                                slotIndex,
                                pos,
                                e.target
                                  .value
                              )
                            }
                            style={{
                              marginRight:
                                8,
                              marginBottom:
                                4
                            }}
                          >
                            <option value="">
                              Escolha{' '}
                              {pos +
                                1}
                            </option>

                            {cardapio
                              .filter(
                                (
                                  p
                                ) =>
                                  p.categoria_id ===
                                    slot.categoria_id &&
                                  p.tipo !==
                                    'combo'
                              )
                              .map(
                                (
                                  p
                                ) => (
                                  <option
                                    key={
                                      p.id
                                    }
                                    value={
                                      p.id
                                    }
                                  >
                                    {
                                      p.nome
                                    }
                                  </option>
                                )
                              )}
                          </select>
                        )
                      )}
                    </div>
                  )
                )}
              </div>
            )}

          {produto && (
            <>
              {adicionais.length >
                0 && (
                <div
                  style={{
                    marginTop: 8
                  }}
                >
                  <p>
                    Adicionais:
                  </p>

                  {adicionais.map(
                    (a) => (
                      <label
                        key={
                          a.id
                        }
                        style={{
                          display:
                            'block'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={extrasSelecionados.some(
                            (e) =>
                              e.nome ===
                              a.nome
                          )}
                          onChange={() =>
                            toggleExtra(
                              a
                            )
                          }
                        />

                        {' '}
                        {a.nome}
                        {' — R$ '}

                        {Number(
                          a.preco
                        ).toFixed(2)}
                      </label>
                    )
                  )}
                </div>
              )}

              <textarea
                placeholder="Observações"
                value={
                  observacoes
                }
                onChange={(e) =>
                  setObservacoes(
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  marginTop: 8
                }}
              />

              <div
                style={{
                  marginTop: 8
                }}
              >
                Quantidade:{' '}

                <input
                  type="number"
                  min={1}
                  value={
                    quantidade
                  }
                  onChange={(e) =>
                    setQuantidade(
                      Number(
                        e.target
                          .value
                      )
                    )
                  }
                  style={{
                    width: 60
                  }}
                />
              </div>

              <button
                onClick={
                  adicionarItem
                }
                style={{
                  marginTop: 8
                }}
              >
                Adicionar item
              </button>
            </>
          )}

          {erro && (
            <p
              style={{
                color: 'red'
              }}
            >
              {erro}
            </p>
          )}

          <h3>
            Itens montados
          </h3>

          {itensNovos.length ===
            0 && (
            <p>
              Nenhum item montado.
            </p>
          )}

          <ul>
            {itensNovos.map(
              (i, idx) => (
                <li key={idx}>
                  {i.quantidade}x{' '}
                  {i.nome}

                  {i.tamanho !==
                    '-' &&
                    ` (${i.tamanho})`}

                  {i.extras
                    .length > 0 &&
                    ` + ${i.extras.join(
                      ', '
                    )}`}

                  {' — R$ '}

                  {(
                    i.precoUnitario *
                    i.quantidade
                  ).toFixed(2)}

                  <button
                    onClick={() =>
                      removerItem(
                        idx
                      )
                    }
                    style={{
                      marginLeft:
                        8
                    }}
                  >
                    Remover
                  </button>
                </li>
              )
            )}
          </ul>

          <h2>
            Abrir nova comanda com os
            itens montados acima
          </h2>

          <input
            placeholder="Nome do responsável pela comanda"
            value={
              novaComandaNome
            }
            onChange={(e) =>
              setNovaComandaNome(
                e.target.value
              )
            }
          />

          <label
            style={{
              display: 'block',
              marginTop: 4
            }}
          >
            <input
              type="checkbox"
              checked={
                incluirGorjeta
              }
              onChange={(e) =>
                setIncluirGorjeta(
                  e.target.checked
                )
              }
            />

            {' '}
            Incluir gorjeta de 10%
          </label>

          <button
            onClick={
              handleAbrirComanda
            }
            disabled={
              !novaComandaNome ||
              itensNovos.length ===
                0
            }
          >
            Abrir Comanda
          </button>
        </>
      )}
    </div>
  );
}