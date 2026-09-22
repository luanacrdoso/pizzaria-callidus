import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { gerarPayloadPix } from '../api/pix';

const API_URL = import.meta.env.VITE_API_URL;
const TEMPO_LIMITE_SEGUNDOS = 5 * 60;

async function buscarConfig() {
  const r = await fetch(`${API_URL}/config`);
  return r.json();
}

export function PagamentoPage() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formaPagamento, total } = (location.state as { formaPagamento?: string; total?: number }) ?? {};

  const ehPix = formaPagamento === 'Pix';
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: buscarConfig, enabled: ehPix });

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [payload, setPayload] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [status, setStatus] = useState<'aguardando' | 'confirmado'>('aguardando');
  const [segundosRestantes, setSegundosRestantes] = useState(TEMPO_LIMITE_SEGUNDOS);

  useEffect(() => {
    if (!ehPix || !config?.chave_pix) return;
    const codigo = gerarPayloadPix({
      chave: config.chave_pix,
      nomeRecebedor: config.nome ?? 'Pizzaria',
      valor: total,
      txid: `PED${pedidoId}`,
      descricao: `Pedido ${pedidoId}`,
    });
    setPayload(codigo);
    QRCode.toDataURL(codigo).then(setQrCodeUrl);
  }, [config, ehPix, total, pedidoId]);

  useEffect(() => {
    if (ehPix) return; // Pix só confirma pelo botão manual, os outros simulam automaticamente
    const timer = setTimeout(() => setStatus('confirmado'), 2000);
    return () => clearTimeout(timer);
  }, [ehPix]);

  // Cronômetro de 5 minutos, só para Pix
  useEffect(() => {
    if (!ehPix || status === 'confirmado' || segundosRestantes <= 0) return;
    const intervalo = setInterval(() => setSegundosRestantes((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(intervalo);
  }, [ehPix, status, segundosRestantes]);

  const handleCopiar = () => {
    navigator.clipboard.writeText(payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (status === 'confirmado') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Pagamento confirmado!</p>
        <button onClick={() => navigate(`/pedido/${pedidoId}`)}>Acompanhar pedido</button>
      </div>
    );
  }

  if (ehPix) {
    if (segundosRestantes <= 0) {
      return (
        <div style={{ padding: 24, textAlign: 'center', maxWidth: 360, margin: '0 auto' }}>
          <h1>Tempo esgotado</h1>
          <p>O prazo de 5 minutos para pagamento deste pedido expirou.</p>
          <button onClick={() => navigate('/carrinho')}>Voltar ao carrinho</button>
        </div>
      );
    }

    const percentualDecorrido = ((TEMPO_LIMITE_SEGUNDOS - segundosRestantes) / TEMPO_LIMITE_SEGUNDOS) * 100;
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;

    return (
      <div style={{ padding: 24, textAlign: 'center', maxWidth: 360, margin: '0 auto' }}>
        <h1>Pague com Pix</h1>
        {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code Pix" style={{ width: 240, height: 240, margin: '0 auto', display: 'block' }} />
        ) : (
          <p>Gerando QR Code...</p>
        )}
        <p>Escaneie com o app do seu banco, ou copie o código abaixo:</p>
        <textarea readOnly value={payload} style={{ width: '100%', height: 80, fontSize: 11, boxSizing: 'border-box' }} />
        <button onClick={handleCopiar}>{copiado ? 'Copiado!' : 'Copiar código Pix'}</button>

        <div className="barra-tempo-container">
          <div
            className={`barra-tempo-preenchimento ${percentualDecorrido > 80 ? 'alerta' : ''}`}
            style={{ width: `${percentualDecorrido}%` }}
          />
        </div>
        <p style={{ fontSize: 13, color: '#888' }}>
          Tempo restante para pagar: {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
        </p>

        <button onClick={() => navigate(`/pedido/${pedidoId}`)} style={{ marginTop: 8 }}>
          Já paguei — acompanhar pedido
        </button>
      </div>
    );
  }

  return <div style={{ padding: 24, textAlign: 'center' }}><p>Processando pagamento...</p></div>;
}