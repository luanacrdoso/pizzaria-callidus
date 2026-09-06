import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarReservasMesa, criarReservaMesa, atualizarReservaMesa } from '../api/reservasMesa';
import { buscarMesas } from '../api/mesas';

export function AdminReservasMesaPage() {
  const queryClient = useQueryClient();

  const { data: reservas } = useQuery({ queryKey: ['reservas-mesa'], queryFn: buscarReservasMesa });
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['reservas-mesa'] });

  const mutationCriar = useMutation({
    mutationFn: criarReservaMesa,
    onSuccess: () => { invalidar(); limparForm(); }
  });

  const mutationAtualizar = useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: { status?: string; mesa_id?: number | null } }) =>
      atualizarReservaMesa(id, dados),
    onSuccess: invalidar
  });

  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [dataReserva, setDataReserva] = useState('');
  const [horarioReserva, setHorarioReserva] = useState('');
  const [pessoas, setPessoas] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const limparForm = () => {
    setNomeCliente(''); setTelefoneCliente(''); setDataReserva(''); setHorarioReserva('');
    setPessoas(''); setObservacoes('');
  };

  const handleCriar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente || !dataReserva) return;
    mutationCriar.mutate({
      nome_cliente: nomeCliente,
      telefone_cliente: telefoneCliente,
      data_reserva: dataReserva,
      horario_reserva: horarioReserva,
      quantidade_pessoas: pessoas ? Number(pessoas) : null,
      observacoes
    });
  };

  const ativas = reservas?.filter((r) => r.status === 'ativa') ?? [];
  const concluidas = reservas?.filter((r) => r.status === 'concluida') ?? [];
  const canceladas = reservas?.filter((r) => r.status === 'cancelada') ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Reservas de Mesa</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Cadastrar Reserva (recebida por WhatsApp)</h2>
        <form onSubmit={handleCriar} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
          <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Nome do cliente" required />
          <input value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} placeholder="Telefone" />
          <input type="date" value={dataReserva} onChange={(e) => setDataReserva(e.target.value)} required />
          <input value={horarioReserva} onChange={(e) => setHorarioReserva(e.target.value)} placeholder="Horário (ex: 20:00)" />
          <input type="number" value={pessoas} onChange={(e) => setPessoas(e.target.value)} placeholder="Nº de pessoas" />
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" />
          <button type="submit" disabled={mutationCriar.isPending}>
            {mutationCriar.isPending ? 'Salvando...' : 'Cadastrar Reserva'}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Reservas Ativas</h2>
        {ativas.length === 0 && <p>Nenhuma reserva ativa.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ativas.map((r) => (
            <li key={r.id} style={{ marginBottom: 8, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
              <strong>{r.nome_cliente}</strong> — {r.data_reserva} {r.horario_reserva} · {r.quantidade_pessoas ?? '?'} pessoas
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                <label>
                  Mesa:{' '}
                  <select
                    value={r.mesa_id ?? ''}
                    onChange={(e) => mutationAtualizar.mutate({ id: r.id, dados: { mesa_id: e.target.value ? Number(e.target.value) : null } })}
                  >
                    <option value="">Não atribuída</option>
                    {mesas?.map((m) => (
                      <option key={m.id} value={m.id}>Mesa {m.numero} ({m.capacidade} lugares)</option>
                    ))}
                  </select>
                </label>
                <button onClick={() => mutationAtualizar.mutate({ id: r.id, dados: { status: 'concluida' } })}>Concluir</button>
                <button onClick={() => mutationAtualizar.mutate({ id: r.id, dados: { status: 'cancelada' } })}>Cancelar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Reservas Concluídas</h2>
        {concluidas.length === 0 && <p>Nenhuma reserva concluída ainda.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {concluidas.map((r) => (
            <li key={r.id} style={{ marginBottom: 4, opacity: 0.7 }}>
              {r.nome_cliente} — {r.data_reserva} {r.horario_reserva}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Reservas Canceladas</h2>
        {canceladas.length === 0 && <p>Nenhuma reserva cancelada.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {canceladas.map((r) => (
            <li key={r.id} style={{ marginBottom: 4, opacity: 0.5, textDecoration: 'line-through' }}>
              {r.nome_cliente} — {r.data_reserva} {r.horario_reserva}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}