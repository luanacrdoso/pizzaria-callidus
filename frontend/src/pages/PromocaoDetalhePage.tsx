import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarrinhoStore } from '../api/carrinho';
import { buscarPromocoes } from '../api/promocoes';
import { buscarPizzas } from '../api/pizzas';
import { buscarCategorias } from '../api/categorias';

export function PromocaoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const adicionarItem = useCarrinhoStore((s) => s.adicionarItem);

  const { data: promocoes, isLoading, isError } = useQuery({ queryKey: ['promocoes'], queryFn: buscarPromocoes });
  const { data: cardapio } = useQuery({ queryKey: ['pizzas'], queryFn: buscarPizzas });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const [escolhas, setEscolhas] = useState<Record<number, string[]>>({});
  const [erro, setErro] = useState('');

  if (isLoading) return <p>Carregando...</p>;
  const promo = promocoes?.find((p: any) => String(p.id) === id);
  if (isError || !promo) return <p>Promoção não encontrada.</p>;

  const nomeCategoria = (catId: number) => categorias?.find((c: any) => c.id === catId)?.nome ?? '';

  const atualizarEscolha = (slotIndex: number, posicao: number, pizzaId: string) => {
    setEscolhas((atual) => {
      const nova = [...(atual[slotIndex] ?? [])];
      nova[posicao] = pizzaId;
      return { ...atual, [slotIndex]: nova };
    });
  };

  const handleAdicionar = () => {
    const slots = promo.combo_slots ?? [];
    const nomesEscolhidos: string[] = [];
    for (let i = 0; i < slots.length; i++) {
      const feitas = escolhas[i] ?? [];
      for (let pos = 0; pos < slots[i].quantidade; pos++) {
        if (!feitas[pos]) { setErro('Complete todas as escolhas do combo.'); return; }
        const item = cardapio?.find((p: any) => String(p.id) === feitas[pos]);
        if (item) nomesEscolhidos.push(item.nome);
      }
    }
    setErro('');
    adicionarItem({
      pizzaId: 0,
      nome: `${promo.nome} (${nomesEscolhidos.join(', ')})`,
      tamanho: '-',
      extras: [],
      observacoes: '',
      quantidade: 1,
      precoUnitario: Number(promo.preco_combo ?? 0),
      imagemUrl: promo.imagem_url,
    });
    navigate('/carrinho');
  };

  return (
    <div>
      <Link to="/" className="voltar-link">← Voltar ao Cardápio</Link>
      <div className="detalhe-produto">
        {promo.imagem_url && <img src={promo.imagem_url} alt={promo.nome} className="detalhe-produto-img" />}
        <div className="detalhe-produto-painel">
          <span className="pizza-card-tag" style={{ background: 'var(--gold-dark)', color: 'white' }}>🎉 Combo</span>
          <h1>{promo.nome}</h1>
          <p>{promo.descricao}</p>
          <hr />
          <p><strong>Preço do combo: R$ {Number(promo.preco_combo ?? 0).toFixed(2)}</strong></p>

          {(promo.combo_slots ?? []).map((slot: any, slotIndex: number) => (
            <div key={slotIndex} style={{ marginBottom: 16 }}>
              <h3>{slot.rotulo || nomeCategoria(slot.categoria_id)}</h3>
              {Array.from({ length: slot.quantidade }).map((_, pos) => (
                <select
                  key={pos}
                  value={escolhas[slotIndex]?.[pos] ?? ''}
                  onChange={(e) => atualizarEscolha(slotIndex, pos, e.target.value)}
                  style={{ marginRight: 8, marginBottom: 6 }}
                >
                  <option value="">Escolha {pos + 1}</option>
                  {cardapio?.filter((p: any) => p.categoria_id === slot.categoria_id && p.tipo !== 'combo').map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              ))}
            </div>
          ))}

          {erro && <p className="mensagem-erro-box" style={{ marginTop: 12 }}>{erro}</p>}

          <button className="cta-fixo" onClick={handleAdicionar}>
            Adicionar ao Carrinho — R$ {Number(promo.preco_combo ?? 0).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}