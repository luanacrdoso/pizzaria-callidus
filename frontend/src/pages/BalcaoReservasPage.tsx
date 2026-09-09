import { useQuery } from '@tanstack/react-query';
 
const API_URL = import.meta.env.VITE_API_URL;
 
async function buscarReservasMesa() {
  const r = await fetch(`${API_URL}/reservas-mesa?status=ativa`);
  return r.json();
}
async function buscarReservasSalao() {
  const r = await fetch(`${API_URL}/reservas-salao?status=ativa`);
  return r.json();
}
 
export function BalcaoReservasPage() {
  const { data: reservasMesa } = useQuery({ queryKey: ['reservas-mesa-ativas'], queryFn: buscarReservasMesa });
  const { data: reservasSalao } = useQuery({ queryKey: ['reservas-salao-ativas'], queryFn: buscarReservasSalao });
 
  return (
    <div style={{ padding: 24 }}>
      <h1>Reservas Ativas</h1>
 
      <h2>Mesas</h2>
      {(!reservasMesa || reservasMesa.length === 0) && <p>Nenhuma reserva de mesa ativa.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {reservasMesa?.map((r: any) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            {r.nome_cliente} — {r.data_reserva} {r.horario_reserva} — {r.quantidade_pessoas} pessoas
            {r.mesa_id && <> — Mesa {r.mesa_id}</>}
          </li>
        ))}
      </ul>
 
      <h2>Salão de Eventos</h2>
      {(!reservasSalao || reservasSalao.length === 0) && <p>Nenhuma reserva de salão ativa.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {reservasSalao?.map((r: any) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            {r.nome_cliente} — {r.data_evento} {r.horario_evento} — {r.quantidade_convidados} convidados
          </li>
        ))}
      </ul>
    </div>
  );
}
