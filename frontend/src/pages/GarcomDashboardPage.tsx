import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchComoFuncionario } from '../api/funcionarioAuth';
 
const API_URL = import.meta.env.VITE_API_URL;
 
export function GarcomDashboardPage() {
  const [periodo, setPeriodo] = useState('hoje');
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-garcom', periodo],
    queryFn: async () => {
      const r = await fetchComoFuncionario(`${API_URL}/dashboard/garcom?periodo=${periodo}`);
      return r.json();
    },
  });
 
  return (
    <div style={{ padding: 24 }}>
      <h1>Meus Ganhos</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setPeriodo("hoje")} disabled={periodo === "hoje"}>Hoje</button>
        <button onClick={() => setPeriodo("7dias")} disabled={periodo === "7dias"}>Últimos 7 dias</button>
        <button onClick={() => setPeriodo("mes")} disabled={periodo === "mes"}>Último mês</button>
      </div>
      {isLoading ? <p>Carregando...</p> : <h2>R$ {data?.ganho_total?.toFixed(2) ?? "0.00"}</h2>}
      <p style={{ fontSize: 13, color: "#888" }}>Valor referente à sua parte na divisão das gorjetas dos dias trabalhados no período.</p>
    </div>
  );
}
