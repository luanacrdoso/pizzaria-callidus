export interface Pizza {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  imagem_url: string;
  preco_brotinho: string;
  preco_media: string;
  preco_grande: string;
  tipo: string;
  visivel: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarPizzas(): Promise<Pizza[]> {
  const resposta = await fetch(`${API_URL}/pizzas`);
  if (!resposta.ok) throw new Error('Erro ao buscar cardápio.');
  return resposta.json();
}

export async function criarPizza(dados: Omit<Pizza, 'id' | 'visivel'>): Promise<Pizza> {
  const resposta = await fetch(`${API_URL}/pizzas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) throw new Error('Erro ao criar pizza.');
  return resposta.json();
}

export async function editarPizza(pizza: Pizza): Promise<Pizza> {
  const resposta = await fetch(`${API_URL}/pizzas/${pizza.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pizza)
  });
  if (!resposta.ok) throw new Error('Erro ao editar pizza.');
  return resposta.json();
}

export async function excluirPizza(id: number): Promise<void> {
  const resposta = await fetch(`${API_URL}/pizzas/${id}`, { method: 'DELETE' });
  if (!resposta.ok) throw new Error('Erro ao excluir pizza.');
}