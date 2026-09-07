import { useQuery } from '@tanstack/react-query';
import { useCarrinhoStore } from '../api/carrinho';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarCardapioPublico() {
  const resposta = await fetch(`${API_URL}/pizzas?visivel=true`);
  if (!resposta.ok) throw new Error('Erro ao buscar cardápio.');
  return resposta.json();
}

export function CardapioPublicoPage() {
  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['cardapio-publico'], queryFn: buscarCardapioPublico });
  const adicionarItem = useCarrinhoStore((s) => s.adicionarItem);

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;
  if (pizzas.length === 0) return <p>Nenhum item disponível no momento.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Cardápio</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {pizzas.map((pizza: any) => (
          <li key={pizza.id} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
            <strong>{pizza.nome}</strong> — {pizza.descricao}
            <div>R$ {pizza.preco_media} (média)</div>
            <button onClick={() => adicionarItem({
              pizzaId: pizza.id, nome: pizza.nome, tamanho: "media", extras: [], observacoes: "",
              quantidade: 1, precoUnitario: Number(pizza.preco_media)
            })}>Adicionar ao carrinho</button>
          </li>
        ))}
      </ul>
    </div>
  );
}