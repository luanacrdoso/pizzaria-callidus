import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarMesas, criarMesa, editarMesa, excluirMesa, type Mesa } from '../api/mesas';

export function AdminMesasPage() {
  const queryClient = useQueryClient();
  const { data: mesas, isLoading, isError } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
  const [proximoNumero] = useState(1);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['mesas'] });

  const mutationCriar = useMutation({ mutationFn: criarMesa, onSuccess: invalidar });
  const mutationEditar = useMutation({ mutationFn: editarMesa, onSuccess: invalidar });
  const mutationExcluir = useMutation({ mutationFn: excluirMesa, onSuccess: invalidar });

  const handleAdicionarMesa = () => {
    const numero = (mesas?.length ?? 0) + proximoNumero;
    mutationCriar.mutate({ numero, capacidade: 4 });
  };

  const handleAjustarCadeiras = (mesa: Mesa, delta: number) => {
    const novaCapacidade = Math.max(1, mesa.capacidade + delta);
    mutationEditar.mutate({ ...mesa, capacidade: novaCapacidade });
  };

  if (isLoading) return <p style={{ padding: 24 }}>Carregando mesas...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar mesas.</p>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Mesas do Salão</h1>
        <button onClick={handleAdicionarMesa} disabled={mutationCriar.isPending}>+ Nova Mesa</button>
      </div>

      {mesas?.length === 0 && <p>Nenhuma mesa cadastrada ainda.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {mesas?.map((mesa) => (
          <li key={mesa.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <strong>Mesa {mesa.numero}</strong>
            <input
              key={mesa.id}
              defaultValue={mesa.nome ?? ''}
              placeholder="Apelido (opcional)"
              onBlur={(e) => {
                const novoNome = e.target.value.trim() || null;
                if (novoNome !== mesa.nome) {
                  mutationEditar.mutate({ ...mesa, nome: novoNome });
                }
              }}
              style={{ width: 140 }}
            />
            <span>{mesa.capacidade} lugares · {mesa.status}</span>
            <span>cadeiras:</span>
            <button onClick={() => handleAjustarCadeiras(mesa, 1)}>+</button>
            <button onClick={() => handleAjustarCadeiras(mesa, -1)}>-</button>
            <button onClick={() => mutationExcluir.mutate(mesa.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}