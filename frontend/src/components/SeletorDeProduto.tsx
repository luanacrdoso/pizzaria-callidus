import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarPizzas } from '../api/pizzas';
import { buscarPromocoes } from '../api/promocoes';
import { buscarCategorias } from '../api/categorias';
 
// Reaproveita a mesma lógica visual do CardapioPublicoPage.tsx (filtro por categoria + grid de cards),
// mas em vez de navegar para /produto/:id ao clicar, chama onSelecionar(produto) e fecha.
export function SeletorDeProduto({ onSelecionar, onFechar }: { onSelecionar: (item: any) => void; onFechar: () => void }) {
  const { data: pizzas } = useQuery({ queryKey: ["pizzas"], queryFn: buscarPizzas });
  const { data: promocoes } = useQuery({ queryKey: ["promocoes"], queryFn: buscarPromocoes });
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: buscarCategorias });
  const [categoriaAtiva, setCategoriaAtiva] = useState("Promoções");
 
  const itensDaCategoria = categoriaAtiva === "Promoções"
    ? (promocoes ?? [])
    : (pizzas ?? []).filter((p: any) => p.categoria === categoriaAtiva);
 
  return (
    <div className="modal-seletor-produto">
      <div className="filtros-cardapio">
        <button onClick={() => setCategoriaAtiva("Promoções")} className={`categoria-pill ${categoriaAtiva === "Promoções" ? "ativa" : ""}`}>🎉 Promoções</button>
        {categorias?.map((c: any) => (
          <button key={c.id} onClick={() => setCategoriaAtiva(c.nome)} className={`categoria-pill ${categoriaAtiva === c.nome ? "ativa" : ""}`}>{c.nome}</button>
        ))}
        <button onClick={onFechar} className="btn-secundario">Fechar</button>
      </div>
      <div className="cardapio-container">
        {itensDaCategoria.map((item: any) => (
          <div key={item.id} className="pizza-card" onClick={() => onSelecionar(item)} style={{ cursor: "pointer" }}>
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
