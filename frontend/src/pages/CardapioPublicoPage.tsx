import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { buscarMediaAvaliacoes } from '../api/avaliacoes';
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

  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [busca, setBusca] = useState('');

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;

  const categorias = ['Todas', ...Array.from(new Set(pizzas.map((p: any) => p.categoria)))];
  const listaFiltrada = pizzas.filter((p: any) => {
    const passaCategoria = categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva;
    const passaBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return passaCategoria && passaBusca;
  });

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
            {c as string}
          </button>
        ))}
        <input className="busca-cardapio" placeholder="Buscar no cardápio..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {listaFiltrada.length === 0 && <p>Nenhum item encontrado.</p>}

      <div className="cardapio-container">
        {listaFiltrada.map((pizza: any) => (
          <Link to={`/produto/${pizza.id}`} key={pizza.id} className="pizza-card" style={{ display: 'block' }}>
            <div style={{ position: 'relative' }}>
              {pizza.imagem_url && <img src={pizza.imagem_url} alt={pizza.nome} className="pizza-card-img" />}
              <span className="pizza-card-tag" style={{ position: 'absolute', top: 10, left: 10 }}>{pizza.categoria}</span>
            </div>
            <div className="pizza-card-corpo">
              <h3>{pizza.nome}</h3>
              <p className="pizza-card-desc">{pizza.descricao}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="subtext">a partir de</div>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
                    R$ {Number(pizza.preco_brotinho ?? pizza.preco_media ?? pizza.preco_combo ?? 0).toFixed(2)}
                  </strong>
                </div>
                <button style={{ pointerEvents: 'none' }}>Pedir 🍕</button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}