import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarPizzas } from '../api/pizzas';
import { buscarCategorias } from '../api/categorias';

// Reaproveita a mesma lógica visual do CardapioPublicoPage.tsx (filtro por categoria + grid de cards),
// mas em vez de navegar para /produto/:id ao clicar, chama onSelecionar(produto) e fecha.
export function SeletorDeProduto({ onSelecionar, onFechar }: { onSelecionar: (item: any) => void; onFechar: () => void }) {
  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['pizzas'], queryFn: buscarPizzas });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  const itensDaCategoria = categoriaAtiva === 'Todas'
    ? (pizzas ?? [])
    : (pizzas ?? []).filter((p) => p.categoria === categoriaAtiva);

  return (
    <div className="modal-seletor-produto">
      <div className="filtros-cardapio">
        <button
          type="button"
          onClick={() => setCategoriaAtiva('Todas')}
          className={`categoria-pill ${categoriaAtiva === 'Todas' ? 'ativa' : ''}`}
        >
          Todos
        </button>
        {categorias?.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setCategoriaAtiva(c.nome)}
            className={`categoria-pill ${categoriaAtiva === c.nome ? 'ativa' : ''}`}
          >
            {c.nome}
          </button>
        ))}
        <button type="button" onClick={onFechar} className="btn-secundario">Fechar</button>
      </div>

      {isLoading && <p>Carregando produtos...</p>}
      {isError && <p className="mensagem-erro-box">Erro ao carregar os produtos.</p>}
      {!isLoading && !isError && itensDaCategoria.length === 0 && <p>Nenhum produto nesta categoria.</p>}

      <div className="cardapio-container">
        {itensDaCategoria.map((item) => (
          <div
            key={item.id}
            className="pizza-card"
            onClick={() => onSelecionar(item)}
            style={{ cursor: 'pointer' }}
          >
            {item.imagem_url && <img src={item.imagem_url} alt={item.nome} className="pizza-card-img" />}
            <div className="pizza-card-corpo">
              <h3>{item.nome}</h3>
              <p className="pizza-card-desc">{item.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
