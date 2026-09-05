export interface RestauranteConfig {
  id: number;
  nome: string;
  descricao: string;
  logo_url: string;
  capa_url: string;
  cor_primaria_clara: string;
  cor_secundaria_clara: string;
  cor_primaria_escura: string;
  cor_secundaria_escura: string;
  endereco: string;
  dias_funcionamento: string;
  horario_funcionamento: string;
  telefone: string;
  tempo_preparo_estimado: string;
  taxa_entrega: string;
  chave_pix: string;
  formas_pagamento_aceitas: string[];
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarConfig(): Promise<RestauranteConfig> {
  const resposta = await fetch(`${API_URL}/config`);
  if (!resposta.ok) throw new Error('Erro ao buscar configuração.');
  return resposta.json();
}

export async function atualizarConfig(config: RestauranteConfig): Promise<RestauranteConfig> {
  const resposta = await fetch(`${API_URL}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar configuração.');
  return resposta.json();
}