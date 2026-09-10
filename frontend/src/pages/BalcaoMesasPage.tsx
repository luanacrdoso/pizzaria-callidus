import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarMesas, criarMesa, editarMesa, excluirMesa, type Mesa } from '../api/mesas';
 
export function BalcaoMesasPage() {
  const queryClient = useQueryClient();
  const { data: mesas, isLoading, isError } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });
 
  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['mesas'] });
  const mutationCriar = useMutation({ mutationFn: criarMesa, onSuccess: invalidar });
  const mutationEditar = useMutation({ mutationFn: editarMesa, onSuccess: invalidar });
  const mutationExcluir = useMutation({ mutationFn: excluirMesa, onSuccess: invalidar });
 
  const handleAdicionarMesa = () => {
    const numero = (mesas?.length ?? 0) + 1;
    mutationCriar.mutate({ numero, capacidade: 4 });
  };
 
  const handleStatus = (mesa: Mesa, novoStatus: string) => {
    mutationEditar.mutate({ ...mesa, status: novoStatus });
  };
 
  if (isLoading) return <p style={{ padding: 24 }}>Carregando mesas...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar mesas.</p>;
 
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Mesas do Salão</h1>
        <button onClick={handleAdicionarMesa}>+ Nova Mesa</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {mesas?.map((mesa) => (
          <li key={mesa.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <strong>Mesa {mesa.numero}</strong>
            <span>{mesa.nome ?? ""}</span>
            <span>{mesa.capacidade} lugares</span>
            <select value={mesa.status} onChange={(e) => handleStatus(mesa, e.target.value)}>
              <option value="livre">Livre</option>
              <option value="ocupada">Ocupada</option>
            </select>
            <button onClick={() => mutationExcluir.mutate(mesa.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
