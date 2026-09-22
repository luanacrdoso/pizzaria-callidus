import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarPizzas } from '../api/pizzas';
import { buscarPromocoes } from '../api/promocoes';
import {
  adicionarItemVitrine,
  buscarVitrine,
  criarSecaoVitrine,
  editarSecaoVitrine,
  excluirSecaoVitrine,
  removerItemVitrine,
} from '../api/vitrine';

export function AdminVitrinePage() {
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState('');
  const [selecoes, setSelecoes] = useState<Record<number, string>>({});

  const { data: secoes = [], isLoading } = useQuery({
    queryKey: ['vitrine'],
    queryFn: buscarVitrine,
  });

  const { data: pizzas = [] } = useQuery({
    queryKey: ['pizzas'],
    queryFn: buscarPizzas,
  });

  const { data: promocoes = [] } = useQuery({
    queryKey: ['promocoes'],
    queryFn: buscarPromocoes,
  });

  const invalidar = () => {
    queryClient.invalidateQueries({
      queryKey: ['vitrine'],
    });
  };

  const criarMutation = useMutation({
    mutationFn: criarSecaoVitrine,
    onSuccess: () => {
      setTitulo('');
      invalidar();
    },
  });

  const editarMutation = useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: number;
      dados: {
        titulo: string;
        ordem: number;
        ativa: boolean;
      };
    }) => editarSecaoVitrine(id, dados),
    onSuccess: invalidar,
  });

  const excluirMutation = useMutation({
    mutationFn: excluirSecaoVitrine,
    onSuccess: invalidar,
  });

  const adicionarItemMutation = useMutation({
    mutationFn: adicionarItemVitrine,
    onSuccess: invalidar,
  });

  const removerItemMutation = useMutation({
    mutationFn: removerItemVitrine,
    onSuccess: invalidar,
  });

  const handleCriarSecao = () => {
    const tituloLimpo = titulo.trim();

    if (!tituloLimpo) return;

    criarMutation.mutate({
      titulo: tituloLimpo,
      ordem: secoes.length,
    });
  };

  const moverSecao = async (index: number, direcao: number) => {
  const destino = index + direcao;

  if (destino < 0 || destino >= secoes.length) return;

  const atual = secoes[index];
  const outra = secoes[destino];

  await editarMutation.mutateAsync({
    id: atual.id,
    dados: {
      titulo: atual.titulo,
      ordem: outra.ordem,
      ativa: atual.ativa,
    },
  });

  await editarMutation.mutateAsync({
    id: outra.id,
    dados: {
      titulo: outra.titulo,
      ordem: atual.ordem,
      ativa: outra.ativa,
    },
  });
};

  const handleAdicionarItem = (secaoId: number) => {
    const valor = selecoes[secaoId];

    if (!valor) return;

    const [tipo, id] = valor.split(':');

    adicionarItemMutation.mutate({
      secao_id: secaoId,
      item_tipo: tipo as 'pizza' | 'promocao',
      item_id: Number(id),
      ordem: 0,
    });

    setSelecoes((estado) => ({
      ...estado,
      [secaoId]: '',
    }));
  };

  const obterNomeItem = (tipo: string, id: number) => {
    if (tipo === 'pizza') {
      return pizzas.find((pizza: any) => pizza.id === id)?.nome ?? `Pizza #${id}`;
    }

    return (
      promocoes.find((promocao: any) => promocao.id === id)?.nome ??
      `Promoção #${id}`
    );
  };

  if (isLoading) {
    return <p>Carregando organização da vitrine...</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Organização da Vitrine</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Nova seção</h2>

        <input
          type="text"
          placeholder="Ex: Mais Pedidos"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <button
          type="button"
          onClick={handleCriarSecao}
          style={{ marginLeft: 8 }}
        >
          Criar seção
        </button>
      </section>

      {secoes.map((secao: any, index: number) => (
        <section
          key={secao.id}
          style={{
            marginBottom: 24,
            padding: 16,
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <h2 style={{ marginRight: 'auto' }}>{secao.titulo}</h2>

            <button
              type="button"
              onClick={() => moverSecao(index, -1)}
              disabled={index === 0}
            >
              ▲
            </button>

            <button
              type="button"
              onClick={() => moverSecao(index, 1)}
              disabled={index === secoes.length - 1}
            >
              ▼
            </button>

            <button
              type="button"
              onClick={() => excluirMutation.mutate(secao.id)}
            >
              Excluir
            </button>
          </div>

          <h3>Itens da seção</h3>

          {secao.itens.length === 0 && (
            <p>Nenhum item nesta seção.</p>
          )}

          <ul>
            {secao.itens.map((item: any) => (
              <li key={item.id}>
                {obterNomeItem(item.item_tipo, item.item_id)}

                <button
                  type="button"
                  onClick={() => removerItemMutation.mutate(item.id)}
                  style={{ marginLeft: 8 }}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 12 }}>
            <select
              value={selecoes[secao.id] ?? ''}
              onChange={(e) =>
                setSelecoes((estado) => ({
                  ...estado,
                  [secao.id]: e.target.value,
                }))
              }
            >
              <option value="">Selecionar item</option>

              <optgroup label="Produtos">
                {pizzas.map((pizza: any) => (
                  <option
                    key={`pizza-${pizza.id}`}
                    value={`pizza:${pizza.id}`}
                  >
                    {pizza.nome}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Promoções">
                {promocoes.map((promocao: any) => (
                  <option
                    key={`promocao-${promocao.id}`}
                    value={`promocao:${promocao.id}`}
                  >
                    {promocao.nome}
                  </option>
                ))}
              </optgroup>
            </select>

            <button
              type="button"
              onClick={() => handleAdicionarItem(secao.id)}
              style={{ marginLeft: 8 }}
            >
              Adicionar
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}