import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarPizzas, criarPizza, excluirPizza } from '../api/pizzas';

export function AdminCardapioPage() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');

  const { data: pizzas, isLoading, isError } = useQuery({
    queryKey: ['pizzas'],
    queryFn: buscarPizzas
  });

  const mutationCriar = useMutation({
    mutationFn: criarPizza,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pizzas'] });
      setNome('');
    }
  });

  const mutationExcluir = useMutation({
    mutationFn: excluirPizza,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pizzas'] })
  });

  const handleCriar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    mutationCriar.mutate({
      nome,
      descricao: 'Descrição de teste',
      categoria: 'tradicional',
      imagem_url: '',
      preco_brotinho: '30',
      preco_media: '45',
      preco_grande: '60',
      tipo: 'sabor_unico'
    });
  };

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Cardápio (Admin)</h1>

      <form onSubmit={handleCriar} style={{ marginBottom: 24 }}>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da pizza"
        />
        <button type="submit" disabled={mutationCriar.isPending}>
          {mutationCriar.isPending ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>

      {pizzas?.length === 0 && <p>Nenhuma pizza cadastrada ainda.</p>}

      <ul>
        {pizzas?.map((pizza) => (
          <li key={pizza.id}>
            {pizza.nome} — R$ {pizza.preco_grande}
            <button onClick={() => mutationExcluir.mutate(pizza.id)} style={{ marginLeft: 12 }}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}