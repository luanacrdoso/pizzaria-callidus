import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarCardapioPublico() {
  const resposta = await fetch(`${API_URL}/pizzas?visivel=true`);
  if (!resposta.ok) throw new Error('Erro ao buscar cardápio.');
  return resposta.json();
}

export function CardapioPublicoPage() {
  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['cardapio-publico'], queryFn: buscarCardapioPublico });

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;
  if (pizzas.length === 0) return <p>Nenhum item disponível no momento.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Cardápio</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {pizzas.map((pizza: any) => (
          <li key={pizza.id} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
            <Link to={`/produto/${pizza.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong>{pizza.nome}</strong> — {pizza.descricao}
              <div>a partir de R$ {pizza.preco_media}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}