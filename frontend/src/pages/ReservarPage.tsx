import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
const API_URL = import.meta.env.VITE_API_URL;
export function ReservarPage() {
 const [opcao, setOpcao] = useState<'mesa' | 'salao'>('mesa');
 const { data: config } = useQuery({ queryKey: ['config'], queryFn: async () => (await
fetch(`${API_URL}/config`)).json() });
 const { data: salao } = useQuery({ queryKey: ['salao'], queryFn: async () => (await
fetch(`${API_URL}/salao`)).json() });
 const [nome, setNome] = useState('');
 const [data, setData] = useState('');
 const [horario, setHorario] = useState('');
 const [pessoas, setPessoas] = useState('');
 const montarLinkWhatsapp = () => {
 const telefone = (config?.telefone ?? "").replace(/\D/g, "");
 const tipoTexto = opcao === "mesa" ? "uma mesa" : "o salão de eventos";
 const mensagem = `Olá! Gostaria de reservar ${tipoTexto} para ${pessoas} pessoas, no dia
${data} às ${horario}. Meu nome é ${nome}.`;
 return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
 };
 return (
 <div style={{ padding: 24, maxWidth: 400 }}>
 <h1>Fazer Reserva</h1>
 <div>
 <button onClick={() => setOpcao("mesa")} disabled={opcao === "mesa"}>Mesa</button>
 {salao?.ativo && <button onClick={() => setOpcao("salao")} disabled={opcao ===
"salao"}>Salão de Eventos</button>}
 </div>
 {opcao === "salao" && salao && (
 <div style={{ margin: "12px 0" }}>
 <p><strong>{salao.nome}</strong></p>
 <p>{salao.descricao}</p>
 <p>Capacidade: {salao.capacidade_pessoas} pessoas</p>
 </div>
 )}
 <input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
 <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
 <input placeholder="Horário" value={horario} onChange={(e) => setHorario(e.target.value)}
/>
 <input type="number" placeholder="Nº de pessoas" value={pessoas} onChange={(e) =>
setPessoas(e.target.value)} />
 <a href={montarLinkWhatsapp()} target="_blank" rel="noreferrer">
 <button>Enviar pedido de reserva pelo WhatsApp</button>
 </a>
 </div>
 );
}
