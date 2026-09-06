import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarFuncionarios, aprovarFuncionario, excluirFuncionario } from '../api/funcionarios';

export function AdminFuncionariosPage() {
  const queryClient = useQueryClient();
  const { data: funcionarios, isLoading, isError } = useQuery({ queryKey: ['funcionarios'], queryFn: buscarFuncionarios });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
  const mutationAprovar = useMutation({ mutationFn: aprovarFuncionario, onSuccess: invalidar });
  const mutationExcluir = useMutation({ mutationFn: excluirFuncionario, onSuccess: invalidar });

  if (isLoading) return <p style={{ padding: 24 }}>Carregando funcionários...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar funcionários.</p>;

  const pendentes = funcionarios?.filter((f) => !f.aprovado) ?? [];
  const ativos = funcionarios?.filter((f) => f.aprovado) ?? [];

  return (
    <div style={{ padding: 24 }}>
      <h1>Funcionários</h1>

      <h2>Cadastros Pendentes</h2>
      {pendentes.length === 0 && <p>Nenhum cadastro aguardando aprovação.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pendentes.map((f) => (
          <li key={f.id} style={{ marginBottom: 8 }}>
            {f.nome} (@{f.username}) — {f.cargo}
            <button onClick={() => mutationAprovar.mutate(f.id)} style={{ marginLeft: 8 }}>Aprovar</button>
            <button onClick={() => mutationExcluir.mutate(f.id)} style={{ marginLeft: 8 }}>Recusar</button>
          </li>
        ))}
      </ul>

      <h2>Equipe Ativa</h2>
      {ativos.length === 0 && <p>Nenhum funcionário ativo ainda.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ativos.map((f) => (
          <li key={f.id} style={{ marginBottom: 8 }}>
            {f.nome} (@{f.username}) — {f.cargo}
            <button onClick={() => mutationExcluir.mutate(f.id)} style={{ marginLeft: 8 }}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}