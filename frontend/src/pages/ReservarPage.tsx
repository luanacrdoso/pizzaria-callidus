import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export function ReservarPage() {
  const [opcao, setOpcao] = useState<'mesa' | 'salao'>('mesa');
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: async () => (await fetch(`${API_URL}/config`)).json() });
  const { data: salao } = useQuery({ queryKey: ['salao'], queryFn: async () => (await fetch(`${API_URL}/salao`)).json() });

  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [pessoas, setPessoas] = useState('');

  const montarLinkWhatsapp = () => {
    const telefone = (config?.telefone ?? '').replace(/\D/g, '');
    const tipoTexto = opcao === 'mesa' ? 'uma mesa' : 'o salão de eventos';
    const mensagem = `Olá! Gostaria de reservar ${tipoTexto} para ${pessoas} pessoas, no dia ${data} às ${horario}. Meu nome é ${nome}.`;
    return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
  };

  const formPreenchido = nome && data && horario && pessoas;

  return (
    <div className="max-w-700">
      <h1>Fazer Reserva</h1>
      <p className="subtext">Escolha o tipo de reserva e envie o pedido pelo WhatsApp — a pizzaria confirma com você em seguida.</p>

      <div className="filtros-cardapio" style={{ marginBottom: 20 }}>
        <button type="button" onClick={() => setOpcao('mesa')} className={`categoria-pill ${opcao === 'mesa' ? 'ativa' : ''}`}>
          🍽️ Mesa
        </button>
        {salao?.ativo && (
          <button type="button" onClick={() => setOpcao('salao')} className={`categoria-pill ${opcao === 'salao' ? 'ativa' : ''}`}>
            🎉 Salão de Eventos
          </button>
        )}
      </div>

      {opcao === 'salao' && salao && (
        <div className="card-simples" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 6 }}>{salao.nome}</h3>
          <p>{salao.descricao}</p>
          <p className="subtext">Capacidade: {salao.capacidade_pessoas} pessoas</p>
        </div>
      )}

      <div className="secao-checkout">
        <label className="campo-label">Seu nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" style={{ width: '100%', marginBottom: 14 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="campo-label">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label className="campo-label">Horário</label>
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>

        <label className="campo-label">Número de pessoas</label>
        <input type="number" min={1} value={pessoas} onChange={(e) => setPessoas(e.target.value)} placeholder="Ex: 4" style={{ width: '100%', marginBottom: 20 }} />

        <a href={formPreenchido ? montarLinkWhatsapp() : undefined} target="_blank" rel="noreferrer" style={{ pointerEvents: formPreenchido ? 'auto' : 'none' }}>
          <button className="cta-fixo" disabled={!formPreenchido}>💬 Enviar Pedido de Reserva pelo WhatsApp</button>
        </a>
      </div>
    </div>
  );
}