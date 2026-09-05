import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarConfig, atualizarConfig, type RestauranteConfig } from '../api/config';

const FORMAS_DISPONIVEIS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];

export function AdminConfigPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['config'], queryFn: buscarConfig });
  const [form, setForm] = useState<RestauranteConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: atualizarConfig,
    onSuccess: (novoConfig) => {
      queryClient.setQueryData(['config'], novoConfig);
      alert('Configuração salva!');
    }
  });

  if (isLoading || !form) return <p style={{ padding: 24 }}>Carregando configuração...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar configuração.</p>;

  const atualizarCampo = (campo: keyof RestauranteConfig, valor: string) => {
    setForm({ ...form, [campo]: valor });
  };

  const alternarFormaPagamento = (forma: string) => {
    const atual = form.formas_pagamento_aceitas;
    const novaLista = atual.includes(forma)
      ? atual.filter((f) => f !== forma)
      : [...atual, forma];
    setForm({ ...form, formas_pagamento_aceitas: novaLista });
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h1>Aparência & Configurações</h1>
      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>Nome da Pizzaria
          <input value={form.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} />
        </label>
        <label>Slogan/Descrição
          <input value={form.descricao ?? ''} onChange={(e) => atualizarCampo('descricao', e.target.value)} />
        </label>
        <label>Logotipo (URL)
          <input value={form.logo_url ?? ''} onChange={(e) => atualizarCampo('logo_url', e.target.value)} />
        </label>
        <label>Imagem de Capa (URL)
          <input value={form.capa_url ?? ''} onChange={(e) => atualizarCampo('capa_url', e.target.value)} />
        </label>

        <fieldset>
          <legend>Cores modo claro</legend>
          <label>Primária <input type="color" value={form.cor_primaria_clara} onChange={(e) => atualizarCampo('cor_primaria_clara', e.target.value)} /></label>
          <label>Secundária <input type="color" value={form.cor_secundaria_clara} onChange={(e) => atualizarCampo('cor_secundaria_clara', e.target.value)} /></label>
        </fieldset>

        <fieldset>
          <legend>Cores modo escuro</legend>
          <label>Primária <input type="color" value={form.cor_primaria_escura} onChange={(e) => atualizarCampo('cor_primaria_escura', e.target.value)} /></label>
          <label>Secundária <input type="color" value={form.cor_secundaria_escura} onChange={(e) => atualizarCampo('cor_secundaria_escura', e.target.value)} /></label>
        </fieldset>

        <label>Dias de Funcionamento
          <input value={form.dias_funcionamento ?? ''} onChange={(e) => atualizarCampo('dias_funcionamento', e.target.value)} />
        </label>
        <label>Horário
          <input value={form.horario_funcionamento ?? ''} onChange={(e) => atualizarCampo('horario_funcionamento', e.target.value)} />
        </label>
        <label>Telefone
          <input value={form.telefone ?? ''} onChange={(e) => atualizarCampo('telefone', e.target.value)} />
        </label>
        <label>Tempo de Preparo
          <input value={form.tempo_preparo_estimado ?? ''} onChange={(e) => atualizarCampo('tempo_preparo_estimado', e.target.value)} />
        </label>
        <label>Taxa de Entrega (R$)
          <input type="number" step="0.10" value={form.taxa_entrega} onChange={(e) => atualizarCampo('taxa_entrega', e.target.value)} />
        </label>
        <label>Endereço
          <input value={form.endereco ?? ''} onChange={(e) => atualizarCampo('endereco', e.target.value)} />
        </label>
        <label>Chave Pix
          <input value={form.chave_pix ?? ''} onChange={(e) => atualizarCampo('chave_pix', e.target.value)} />
        </label>

        <fieldset>
          <legend>Formas de Pagamento Aceitas</legend>
          {FORMAS_DISPONIVEIS.map((forma) => (
            <label key={forma} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={form.formas_pagamento_aceitas.includes(forma)}
                onChange={() => alternarFormaPagamento(forma)}
              />
              {' '}{forma}
            </label>
          ))}
        </fieldset>

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Gravar Alterações'}
        </button>
      </form>
    </div>
  );
}