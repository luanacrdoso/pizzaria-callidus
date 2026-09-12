import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarPedidosAtivos } from '../api/pedidosAtivos';
import { fetchComoFuncionario } from '../api/funcionarioAuth';

export function GarcomComandasAtivasPage() {
  const queryClient = useQueryClient();

  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pedidos-ativos'],
    queryFn: buscarPedidosAtivos,
    refetchInterval: 5000,
  });

  const alterarStatus = async (pedidoId: number, novoStatus: string) => {
    try {
      const resposta = await fetchComoFuncionario(
        `${import.meta.env.VITE_API_URL}/pedidos/${pedidoId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (!resposta.ok) {
        const erro = await resposta.json();
        alert('Erro ao atualizar status: ' + (erro.mensagem || 'Erro desconhecido'));
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['pedidos-ativos'] });
    } catch (e: any) {
      alert('Erro na requisição: ' + e.message);
    }
  };

  if (isLoading) return <p className="subtext" style={{ padding: 24 }}>Carregando comandas ativas...</p>;
  if (isError) return <div className="mensagem-erro-box">Erro ao carregar comandas ativas.</div>;

  const comandas = (pedidos ?? []).filter((p: any) => p.tipo === 'presencial');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>🍽️ Comandas Ativas</h1>
        <span className="status-badge status-preparo" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
          {comandas.length} comanda(s) aberta(s)
        </span>
      </div>

      {comandas.length === 0 && (
        <div className="cardapio-vazio-cadastro">
          <h3>Nenhuma comanda ativa no momento! 🍕</h3>
          <p>As novas comandas abertas nas mesas aparecerão aqui automaticamente.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comandas.map((p: any) => (
          <div key={p.id} className="card-simples" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>👤 {p.comanda_nome ?? p.cliente_nome}</h3>
                <span className="subtext">
                  📍 {p.mesa_id ? `Mesa ${p.mesa_id}` : 'Mesa: A definir'}
                </span>
              </div>
              <span className={`status-badge status-${p.status}`}>
                {p.status}
              </span>
            </div>

            <hr style={{ margin: '12px 0' }} />

            <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: 16 }}>
              {(p.itens ?? [])
                .filter((i: any) => i.status === 'ativo')
                .map((i: any) => (
                  <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>
                      <strong>{i.quantidade}x</strong> {i.nome} {i.tamanho !== '-' && `(${i.tamanho})`}
                    </span>
                    <strong>R$ {(Number(i.preco_unitario) * i.quantidade).toFixed(2)}</strong>
                  </li>
                ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Total: <span style={{ color: 'var(--gold-dark)' }}>R$ {Number(p.total).toFixed(2)}</span>
              </span>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link to={`/equipe/garcom/montar?comanda=${p.id}${p.mesa_id ? `&mesa=${p.mesa_id}` : ''}`}>
                  <button className="btn-secundario" style={{ fontSize: '0.85rem' }}>
                    + Adicionar Itens
                  </button>
                </Link>

                {p.status === 'pronto' && (
                  <button onClick={() => alterarStatus(p.id, 'entregue')} style={{ fontSize: '0.85rem' }}>
                    Marcar Entregue 🛎️
                  </button>
                )}

                {/* Botão para finalizar e computar as gorjetas no Dashboard */}
                {(p.status === 'entregue' || p.status === 'pronto') && (
                  <button 
                    onClick={() => alterarStatus(p.id, 'finalizado')} 
                    style={{ fontSize: '0.85rem', background: 'var(--success)' }}
                  >
                    Finalizar Comanda ✅
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}