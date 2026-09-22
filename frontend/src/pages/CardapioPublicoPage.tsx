import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { buscarMediaAvaliacoes } from '../api/avaliacoes';
import { buscarPromocoes } from '../api/promocoes';
import { Estrelas } from '../components/Estrelas';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarCardapioPublico() {
  const r = await fetch(`${API_URL}/pizzas?visivel=true`);
  if (!r.ok) throw new Error('Erro ao buscar cardápio.');
  return r.json();
}
async function buscarConfig() {
  const r = await fetch(`${API_URL}/config`);
  return r.json();
}

export function CardapioPublicoPage() {
  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['cardapio-publico'], queryFn: buscarCardapioPublico });
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: buscarConfig });
  const { data: avaliacao } = useQuery({ queryKey: ['media-avaliacoes'], queryFn: buscarMediaAvaliacoes });
  const { data: promocoes } = useQuery({ queryKey: ['promocoes'], queryFn: buscarPromocoes });

  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [busca, setBusca] = useState('');

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;

  const promosAtivas = (promocoes ?? []).filter((p: any) => p.ativa);
  const combosAtivos = promosAtivas.filter((p: any) => p.tipo === 'combo');
  const descontosAtivos = promosAtivas.filter((p: any) => p.tipo === 'desconto_produto');

  const descontoPorPizza: Record<number, any> = {};
  for (const d of descontosAtivos) descontoPorPizza[d.pizza_id] = d;

  const calcularPrecoComDesconto = (precoOriginal: number, desconto: any) => {
    if (!desconto) return precoOriginal;
    if (desconto.desconto_tipo === 'percentual') {
      return precoOriginal * (1 - Number(desconto.desconto_valor) / 100);
    }
    return Math.max(0, precoOriginal - Number(desconto.desconto_valor));
  };

  const categorias = ['Todas', 'Promoções', ...Array.from(new Set(pizzas.map((p: any) => p.categoria)))];

  const listaFiltrada = categoriaAtiva === 'Promoções'
    ? []
    : pizzas.filter((p: any) => {
        const passaCategoria = categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva;
        const passaBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
        return passaCategoria && passaBusca;
      });

  const mostrarCombos = categoriaAtiva === 'Todas' || categoriaAtiva === 'Promoções';

  return (
    <div>
      {config && (
        <div className="hero-loja" style={{ backgroundImage: config.capa_url ? `url(${config.capa_url})` : undefined, backgroundColor: !config.capa_url ? 'var(--gold-dark)' : undefined }}>
          <div className="hero-loja-conteudo">
            {config.logo_url && <img src={config.logo_url} alt={config.nome} className="hero-loja-avatar" />}
            <h1 className="hero-loja-nome">{config.nome}</h1>
            <p className="hero-loja-desc">{config.descricao}</p>
            {avaliacao && avaliacao.total_avaliacoes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Estrelas valor={Math.round(avaliacao.media)} tamanho={18} />
                <span style={{ color: 'white', fontSize: '0.85rem' }}>{avaliacao.media.toFixed(1)} ({avaliacao.total_avaliacoes} avaliações)</span>
              </div>
            )}
            <div className="hero-loja-badges">
              <span className="hero-badge">📍 {config.endereco}</span>
              <span className="hero-badge">🕒 {config.dias_funcionamento} · {config.horario_funcionamento}</span>
              <span className="hero-badge">🛵 Taxa de entrega: R$ {Number(config.taxa_entrega).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="filtros-cardapio">
        {categorias.map((c) => (
          <button key={c as string} onClick={() => setCategoriaAtiva(c as string)} className={`categoria-pill ${categoriaAtiva === c ? 'ativa' : ''}`}>
            {c === 'Promoções' ? '🎉 Promoções' : c as string}
          </button>
        ))}
        <input className="busca-cardapio" placeholder="Buscar no cardápio..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {listaFiltrada.length === 0 && combosAtivos.length === 0 && <p>Nenhum item encontrado.</p>}

      <div className="cardapio-container">
        {mostrarCombos && combosAtivos.map((promo: any) => (
          <Link to={`/promocao/${promo.id}`} key={`promo-${promo.id}`} className="pizza-card" style={{ display: 'block', border: '2px solid var(--gold-dark)' }}>
            <div style={{ position: 'relative' }}>
              {promo.imagem_url && <img src={promo.imagem_url} alt={promo.nome} className="pizza-card-img" />}
              <span className="pizza-card-tag" style={{ position: 'absolute', top: 10, left: 10, background: 'var(--gold-dark)', color: 'white' }}>🎉 Combo</span>
            </div>
            <div className="pizza-card-corpo">
              <h3>{promo.nome}</h3>
              <p className="pizza-card-desc">{promo.descricao}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                  R$ {Number(promo.preco_combo ?? 0).toFixed(2)}
                </strong>
                <button style={{ pointerEvents: 'none' }}>Ver Combo 🎉</button>
              </div>
            </div>
          </Link>
        ))}

        {listaFiltrada.map((pizza: any) => {
          const desconto = descontoPorPizza[pizza.id];
          const precoOriginal = Number(pizza.preco_brotinho ?? pizza.preco_media ?? pizza.preco_combo ?? 0);
          const precoComDesconto = calcularPrecoComDesconto(precoOriginal, desconto);
          return (
            <Link to={`/produto/${pizza.id}`} key={pizza.id} className="pizza-card" style={{ display: 'block' }}>
              <div style={{ position: 'relative' }}>
                {pizza.imagem_url && <img src={pizza.imagem_url} alt={pizza.nome} className="pizza-card-img" />}
                <span className="pizza-card-tag" style={{ position: 'absolute', top: 10, left: 10 }}>{pizza.categoria}</span>
                {desconto && (
                  <span className="pizza-card-tag" style={{ position: 'absolute', top: 10, right: 10, background: '#c0392b', color: 'white' }}>
                    {desconto.desconto_tipo === 'percentual' ? `-${desconto.desconto_valor}%` : `-R$${Number(desconto.desconto_valor).toFixed(2)}`}
                  </span>
                )}
              </div>
              <div className="pizza-card-corpo">
                <h3>{pizza.nome}</h3>
                <p className="pizza-card-desc">{pizza.descricao}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="subtext">a partir de</div>
                    {desconto ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', marginRight: 6 }}>R$ {precoOriginal.toFixed(2)}</span>
                        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#c0392b' }}>R$ {precoComDesconto.toFixed(2)}</strong>
                      </div>
                    ) : (
                      <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>R$ {precoOriginal.toFixed(2)}</strong>
                    )}
                  </div>
                  <button style={{ pointerEvents: 'none' }}>Pedir 🍕</button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}