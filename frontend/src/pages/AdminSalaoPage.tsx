import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buscarSalao, atualizarSalao, buscarReservas, criarReserva, atualizarStatusReserva,
  type SalaoConfig, type Reserva
} from '../api/salao';

export function AdminSalaoPage() {
  const queryClient = useQueryClient();

  // ---------- Configuração do salão ----------
  const { data: salao, isLoading: carregandoSalao } = useQuery({ queryKey: ['salao'], queryFn: buscarSalao });
  const [form, setForm] = useState<SalaoConfig | null>(null);

  useEffect(() => {
    if (salao) setForm(salao);
  }, [salao]);

  const mutationSalvarSalao = useMutation({
    mutationFn: atualizarSalao,
    onSuccess: (novo) => queryClient.setQueryData(['salao'], novo)
  });

  // ---------- Reservas ----------
  const { data: reservas } = useQuery({ queryKey: ['reservas'], queryFn: () => buscarReservas() });

  const invalidarReservas = () => queryClient.invalidateQueries({ queryKey: ['reservas'] });

  const mutationCriarReserva = useMutation({
    mutationFn: criarReserva,
    onSuccess: () => { invalidarReservas(); limparFormReserva(); }
  });

  const mutationStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => atualizarStatusReserva(id, status),
    onSuccess: invalidarReservas
  });

  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [horarioEvento, setHorarioEvento] = useState('');
  const [convidados, setConvidados] = useState('');
  const [valorCombinado, setValorCombinado] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const limparFormReserva = () => {
    setNomeCliente(''); setTelefoneCliente(''); setDataEvento(''); setHorarioEvento('');
    setConvidados(''); setValorCombinado(''); setObservacoes('');
  };

  const handleCriarReserva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente || !dataEvento) return;
    mutationCriarReserva.mutate({
      nome_cliente: nomeCliente,
      telefone_cliente: telefoneCliente,
      data_evento: dataEvento,
      horario_evento: horarioEvento,
      quantidade_convidados: convidados ? Number(convidados) : null,
      valor_combinado: valorCombinado ? Number(valorCombinado) : null,
      observacoes
    });
  };

  if (carregandoSalao || !form) return <p style={{ padding: 24 }}>Carregando salão de eventos...</p>;

  const reservasAtivas = reservas?.filter((r) => r.status === 'ativa') ?? [];
  const reservasConcluidas = reservas?.filter((r) => r.status === 'concluida') ?? [];
  const reservasCanceladas = reservas?.filter((r) => r.status === 'cancelada') ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Salão de Eventos</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Configuração do Espaço</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); mutationSalvarSalao.mutate(form); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}
        >
          <label>
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            {' '}Exibir aba de reserva pro cliente
          </label>
          <input
            value={form.nome ?? ''}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome do salão"
          />
          <input
            value={form.descricao ?? ''}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição"
          />
          <input
            type="number"
            value={form.capacidade_pessoas ?? ''}
            onChange={(e) => setForm({ ...form, capacidade_pessoas: Number(e.target.value) })}
            placeholder="Capacidade (pessoas)"
          />
          <input
            value={form.imagem_url ?? ''}
            onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
            placeholder="URL da imagem"
          />
          <button type="submit" disabled={mutationSalvarSalao.isPending}>
            {mutationSalvarSalao.isPending ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Cadastrar Reserva (recebida por WhatsApp)</h2>
        <form onSubmit={handleCriarReserva} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
          <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Nome do cliente" required />
          <input value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} placeholder="Telefone" />
          <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} required />
          <input value={horarioEvento} onChange={(e) => setHorarioEvento(e.target.value)} placeholder="Horário (ex: 19:00)" />
          <input type="number" value={convidados} onChange={(e) => setConvidados(e.target.value)} placeholder="Nº de convidados" />
          <input type="number" step="0.01" value={valorCombinado} onChange={(e) => setValorCombinado(e.target.value)} placeholder="Valor combinado (R$)" />
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" />
          <button type="submit" disabled={mutationCriarReserva.isPending}>
            {mutationCriarReserva.isPending ? 'Salvando...' : 'Cadastrar Reserva'}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Reservas Ativas</h2>
        {reservasAtivas.length === 0 && <p>Nenhuma reserva ativa.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reservasAtivas.map((r) => (
            <li key={r.id} style={{ marginBottom: 8, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>{r.nome_cliente}</strong> — {r.data_evento} {r.horario_evento} · {r.quantidade_convidados ?? '?'} convidados
              {r.valor_combinado && <> · R$ {r.valor_combinado}</>}
              <div style={{ marginTop: 4 }}>
                <button onClick={() => mutationStatus.mutate({ id: r.id, status: 'concluida' })}>Concluir</button>
                {' '}
                <button onClick={() => mutationStatus.mutate({ id: r.id, status: 'cancelada' })}>Cancelar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Reservas Concluídas</h2>
        {reservasConcluidas.length === 0 && <p>Nenhuma reserva concluída ainda.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reservasConcluidas.map((r) => (
            <li key={r.id} style={{ marginBottom: 4, opacity: 0.7 }}>
              {r.nome_cliente} — {r.data_evento} {r.horario_evento}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Reservas Canceladas</h2>
        {reservasCanceladas.length === 0 && <p>Nenhuma reserva cancelada.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reservasCanceladas.map((r) => (
            <li key={r.id} style={{ marginBottom: 4, opacity: 0.5, textDecoration: 'line-through' }}>
              {r.nome_cliente} — {r.data_evento} {r.horario_evento}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}