import { fetchAutenticado } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarVitrine() {
  const resposta = await fetch(`${API_URL}/vitrine`);

  if (!resposta.ok) {
    throw new Error('Erro ao buscar vitrine.');
  }

  return resposta.json();
}

export async function criarSecaoVitrine(dados: {
  titulo: string;
  ordem: number;
}) {
  const resposta = await fetchAutenticado(`${API_URL}/vitrine/secoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao criar seção.');
  }

  return resposta.json();
}

export async function editarSecaoVitrine(
  id: number,
  dados: {
    titulo: string;
    ordem: number;
    ativa: boolean;
  }
) {
  const resposta = await fetchAutenticado(`${API_URL}/vitrine/secoes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao editar seção.');
  }

  return resposta.json();
}

export async function excluirSecaoVitrine(id: number) {
  const resposta = await fetchAutenticado(`${API_URL}/vitrine/secoes/${id}`, {
    method: 'DELETE',
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao excluir seção.');
  }
}

export async function adicionarItemVitrine(dados: {
  secao_id: number;
  item_tipo: 'pizza' | 'promocao';
  item_id: number;
  ordem: number;
}) {
  const resposta = await fetchAutenticado(`${API_URL}/vitrine/itens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao adicionar item.');
  }

  return resposta.json();
}

export async function removerItemVitrine(id: number) {
  const resposta = await fetchAutenticado(`${API_URL}/vitrine/itens/${id}`, {
    method: 'DELETE',
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao remover item.');
  }
}