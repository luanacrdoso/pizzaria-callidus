import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { buscarPedidosAtivos } from '../api/pedidosAtivos';

export function GarcomComandasAtivasPage() {
  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ['pedidos-ativos'], queryFn: buscarPedidosAtivos, refetchInterval: 8000,
  });

  if (isLoading) return <p>Carregando comandas...</p>;
  if (isError) return <p>Erro ao carregar comandas.</p>;

  const comandas = pedidos.filter((p: any) => p.tipo === 'presencial');

  return (
    <div>
      <h1>Comandas Ativas</h1>

      {comandas.length === 0 && <p className="subtext">Nenhuma comanda ativa no momento.</p>}

      {comandas.map((p: any) => (
        <div key={p.id} className="comanda-card">
          <div className="comanda-card-header">
            <div>
              <h3>{p.comanda_nome ?? p.cliente_nome}</h3>
              <span className="comanda-card-mesa">{p.mesa_id ? `Mesa ${p.mesa_id}` : 'Mesa: a definir'}</span>
            </div>
            <span className={`status-badge status-${p.status}`}>{p.status}</span>
          </div>

          <ul className="comanda-card-itens">
            {(p.itens ?? []).filter((i: any) => i.status === 'ativo').map((i: any) => (
              <li key={i.id}>
                <span>{i.quantidade}x {i.nome} {i.tamanho !== '-' && `(${i.tamanho})`}</span>
                <span>R$ {(i.preco_unitario * i.quantidade).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="comanda-card-footer">
            <span className="comanda-card-total">Total: R$ {p.total}</span>
            <Link to={`/equipe/garcom/montar?comanda=${p.id}${p.mesa_id ? `&mesa=${p.mesa_id}` : ''}`}>
              <button>+ Adicionar Itens</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}