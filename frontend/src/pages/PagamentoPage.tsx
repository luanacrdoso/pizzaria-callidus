import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
export function PagamentoPage() {
 const { pedidoId } = useParams();
 const navigate = useNavigate();
 const [status, setStatus] = useState<'processando' | 'sucesso'>('processando');
 useEffect(() => {
 const timer = setTimeout(() => setStatus('sucesso'), 2000);
 return () => clearTimeout(timer);
 }, []);
 return (
 <div style={{ padding: 24, textAlign: "center" }}>
 {status === 'processando' && <p>Processando pagamento...</p>}
 {status === 'sucesso' && (
 <>
 <p>Pagamento aprovado!</p>
 <button onClick={() => navigate(`/pedido/${pedidoId}`)}>Acompanhar pedido</button>
 </>
 )}
 </div>
 );
}
