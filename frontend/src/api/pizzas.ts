export interface ComboSlot {
  categoria_id: number | string;
  quantidade: number;
  rotulo?: string;
}

export interface Pizza {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  categoria_id?: number | string;
  imagem_url?: string;
  preco_brotinho?: number | string;
  preco_media?: number | string;
  preco_grande?: number | string;
  preco_combo?: number | string;
  tipo: string;
  visivel: boolean;
  max_sabores_brotinho?: number;
  max_sabores_media?: number;
  max_sabores_grande?: number;
  sabores_permitidos?: number[];
  combo_slots?: ComboSlot[];
}

const API_URL = import.meta.env.VITE_API_URL;

function obterHeaderAutenticacao(): Record<string, string> {
  const token =
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('funcionario_token');

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function buscarPizzas(): Promise<Pizza[]> {
  const resposta = await fetch(`${API_URL}/pizzas`);
  if (!resposta.ok) {
    const erroJson = await resposta.json().catch(() => null);
    throw new Error(erroJson?.mensagem || erroJson?.message || 'Erro ao buscar cardápio.');
  }
  return resposta.json();
}

export async function buscarPizzaPorId(id: number): Promise<Pizza> {
  const resposta = await fetch(`${API_URL}/pizzas/${id}`);
  if (!resposta.ok) {
    const erroJson = await resposta.json().catch(() => null);
    throw new Error(erroJson?.mensagem || erroJson?.message || 'Erro ao buscar item do cardápio.');
  }
  return resposta.json();
}

export async function criarPizza(dados: any): Promise<Pizza> {
  const payload = {
    nome: dados.nome?.trim(),
    categoria: dados.categoria || 'Tradicional',
    categoria_id: dados.categoria_id ? Number(dados.categoria_id) : undefined,
    tipo: dados.tipo || 'sabor_unico',
    descricao: dados.descricao?.trim() || '',
    imagem_url: dados.imagem_url?.trim() || '',
    preco_brotinho: dados.preco_brotinho ? Number(dados.preco_brotinho) : 0,
    preco_media: dados.preco_media ? Number(dados.preco_media) : 0,
    preco_grande: dados.preco_grande ? Number(dados.preco_grande) : 0,
    preco_combo: dados.preco_combo ? Number(dados.preco_combo) : undefined,
    visivel: dados.visivel ?? true,
    max_sabores_brotinho: dados.max_sabores_brotinho ? Number(dados.max_sabores_brotinho) : undefined,
    max_sabores_media: dados.max_sabores_media ? Number(dados.max_sabores_media) : undefined,
    max_sabores_grande: dados.max_sabores_grande ? Number(dados.max_sabores_grande) : undefined,
    sabores_permitidos: dados.sabores_permitidos || undefined,
    combo_slots: dados.combo_slots || undefined,
  };

  const resposta = await fetch(`${API_URL}/pizzas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...obterHeaderAutenticacao(),
    },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    const erroJson = await resposta.json().catch(() => null);
    const mensagem = erroJson?.mensagem || erroJson?.message || 'Erro ao criar pizza.';
    console.error('Erro detalhado da API (criarPizza):', erroJson);
    throw new Error(mensagem);
  }

  return resposta.json();
}

export async function editarPizza(pizza: any): Promise<Pizza> {
  const payload = {
    ...pizza,
    nome: pizza.nome?.trim(),
    categoria: pizza.categoria || 'Tradicional',
    categoria_id: pizza.categoria_id ? Number(pizza.categoria_id) : undefined,
    tipo: pizza.tipo || 'sabor_unico',
    descricao: pizza.descricao?.trim() || '',
    imagem_url: pizza.imagem_url?.trim() || '',
    preco_brotinho: pizza.preco_brotinho ? Number(pizza.preco_brotinho) : 0,
    preco_media: pizza.preco_media ? Number(pizza.preco_media) : 0,
    preco_grande: pizza.preco_grande ? Number(pizza.preco_grande) : 0,
    preco_combo: pizza.preco_combo ? Number(pizza.preco_combo) : undefined,
    visivel: pizza.visivel ?? true,
  };

  const resposta = await fetch(`${API_URL}/pizzas/${pizza.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...obterHeaderAutenticacao(),
    },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    const erroJson = await resposta.json().catch(() => null);
    const mensagem = erroJson?.mensagem || erroJson?.message || 'Erro ao editar pizza.';
    console.error('Erro detalhado da API (editarPizza):', erroJson);
    throw new Error(mensagem);
  }

  return resposta.json();
}

export async function excluirPizza(id: number): Promise<void> {
  const resposta = await fetch(`${API_URL}/pizzas/${id}`, {
    method: 'DELETE',
    headers: {
      ...obterHeaderAutenticacao(),
    },
  });

  if (!resposta.ok) {
    const erroJson = await resposta.json().catch(() => null);
    const mensagem = erroJson?.mensagem || erroJson?.message || 'Erro ao excluir pizza.';
    console.error('Erro detalhado da API (excluirPizza):', erroJson);
    throw new Error(mensagem);
  }
}