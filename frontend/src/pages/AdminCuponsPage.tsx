import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarCupons, criarCupom, atualizarCupom, excluirCupom, type Cupom } from '../api/cupons';

const ROTULOS_TIPO: Record<string, string> = {
  percentual: 'Percentual (%)',
  valor_fixo: 'Valor fixo (R$)',
  entrega_gratis: 'Entrega grátis'
};

export function AdminCuponsPage() {
  const queryClient = useQueryClient();
  const { data: cupons, isLoading, isError } = useQuery({ queryKey: ['cupons'], queryFn: buscarCupons });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['cupons'] });
  const mutationCriar = useMutation({ mutationFn: criarCupom, onSuccess: () => { invalidar(); limparForm(); }, onError: (e: any) => setErro(e.message) });
  const mutationAtualizar = useMutation({ mutationFn: atualizarCupom, onSuccess: invalidar });
  const mutationExcluir = useMutation({ mutationFn: excluirCupom, onSuccess: invalidar });

  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<'percentual' | 'valor_fixo' | 'entrega_gratis'>('percentual');
  const [valor, setValor] = useState('');
  const [validadeInicio, setValidadeInicio] = useState('');
  const [validadeFim, setValidadeFim] = useState('');
  const [limiteUsos, setLimiteUsos] = useState('');
  const [erro, setErro] = useState('');

  const limparForm = () => {
    setCodigo(''); setTipo('percentual'); setValor('');
    setValidadeInicio(''); setValidadeFim(''); setLimiteUsos(''); setErro('');
  };

  const handleCriar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!codigo) return;
    mutationCriar.mutate({
      codigo,
      tipo,
      valor: tipo === 'entrega_gratis' ? 0 : Number(valor),
      validade_inicio: validadeInicio || null,
      validade_fim: validadeFim || null,
      limite_usos: limiteUsos ? Number(limiteUsos) : null
    });
  };

  if (isLoading) return <p style={{ padding: 24 }}>Carregando cupons...</p>;
  if (isError) return <p style={{ padding: 24 }}>Erro ao carregar cupons.</p>;

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h1>Cupons de Desconto</h1>

      <form onSubmit={handleCriar} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Código (ex: BEMVINDO10)"
          required
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
          <option value="percentual">Percentual (%)</option>
          <option value="valor_fixo">Valor fixo (R$)</option>
          <option value="entrega_gratis">Entrega grátis</option>
        </select>

        {tipo !== 'entrega_gratis' && (
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={tipo === 'percentual' ? 'Percentual (ex: 10)' : 'Valor em R$ (ex: 15)'}
            required
          />
        )}

        <label>Válido a partir de (opcional)
          <input type="date" value={validadeInicio} onChange={(e) => setValidadeInicio(e.target.value)} />
        </label>
        <label>Válido até (opcional)
          <input type="date" value={validadeFim} onChange={(e) => setValidadeFim(e.target.value)} />
        </label>
        <label>Limite de usos (opcional, deixe vazio para ilimitado)
          <input type="number" value={limiteUsos} onChange={(e) => setLimiteUsos(e.target.value)} />
        </label>

        {erro && <p style={{ color: 'red' }}>{erro}</p>}
        <button type="submit" disabled={mutationCriar.isPending}>
          {mutationCriar.isPending ? 'Salvando...' : 'Criar Cupom'}
        </button>
      </form>

      <h2>Cupons Cadastrados</h2>
      {cupons?.length === 0 && <p>Nenhum cupom cadastrado ainda.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cupons?.map((c) => (
          <li key={c.id} style={{ marginBottom: 12, padding: 8, border: '1px solid #ddd', borderRadius: 6, opacity: c.ativo ? 1 : 0.5 }}>
            <strong>{c.codigo}</strong> — {ROTULOS_TIPO[c.tipo]}
            {c.tipo !== 'entrega_gratis' && <> ({c.tipo === 'percentual' ? `${c.valor}%` : `R$ ${c.valor}`})</>}
            <br />
            <small>
              Usos: {c.usos_atuais}{c.limite_usos ? ` / ${c.limite_usos}` : ' (ilimitado)'}
              {c.validade_fim && ` · válido até ${c.validade_fim}`}
            </small>
            <div style={{ marginTop: 4 }}>
              <button onClick={() => mutationAtualizar.mutate({ ...c, ativo: !c.ativo })}>
                {c.ativo ? 'Desativar' : 'Ativar'}
              </button>{' '}
              <button onClick={() => mutationExcluir.mutate(c.id)}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}