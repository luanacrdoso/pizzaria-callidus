import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarrinhoStore } from '../api/carrinho';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarPizza(id: string) {
  const r = await fetch(`${API_URL}/pizzas/${id}`);
  if (!r.ok) throw new Error('Erro ao buscar item.');
  return r.json();
}

async function buscarAdicionais() {
  const r = await fetch(`${API_URL}/adicionais`);
  return r.json();
}

const TAMANHOS = [
  { chave: 'brotinho', rotulo: 'Brotinho' },
  { chave: 'media', rotulo: 'Média' },
  { chave: 'grande', rotulo: 'Grande' },
];

export function DetalheProdutoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const adicionarItem = useCarrinhoStore((s) => s.adicionarItem);

  const { data: pizza, isLoading, isError } = useQuery({ queryKey: ['pizza', id], queryFn: () => buscarPizza(id!) });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });

  const [tamanho, setTamanho] = useState('media');
  const [extrasSelecionados, setExtrasSelecionados] = useState<{ nome: string; preco: number }[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;
  if (isError || !pizza) return <p style={{ padding: 24 }}>Item não encontrado.</p>;

  const precoTamanho = Number(pizza[`preco_${tamanho}`] ?? 0);
  const precoExtras = extrasSelecionados.reduce((s, e) => s + e.preco, 0);
  const precoUnitario = precoTamanho + precoExtras;

  const toggleExtra = (adicional: any) => {
    const jaTem = extrasSelecionados.some((e) => e.nome === adicional.nome);
    setExtrasSelecionados(jaTem
      ? extrasSelecionados.filter((e) => e.nome !== adicional.nome)
      : [...extrasSelecionados, { nome: adicional.nome, preco: Number(adicional.preco) }]);
  };

  const handleAdicionar = () => {
    adicionarItem({
      pizzaId: pizza.id,
      nome: pizza.nome,
      tamanho,
      extras: extrasSelecionados.map((e) => e.nome),
      observacoes,
      quantidade,
      precoUnitario,
    });
    navigate('/carrinho');
  };

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <Link to="/">← Voltar ao cardápio</Link>
      <h1>{pizza.nome}</h1>
      <p>{pizza.descricao}</p>

      <fieldset>
        <legend>Tamanho</legend>
        {TAMANHOS.filter((t) => pizza[`preco_${t.chave}`]).map((t) => (
          <label key={t.chave} style={{ display: 'block' }}>
            <input type="radio" name="tamanho" checked={tamanho === t.chave} onChange={() => setTamanho(t.chave)} />
            {' '}{t.rotulo} — R$ {Number(pizza[`preco_${t.chave}`]).toFixed(2)}
          </label>
        ))}
      </fieldset>

      {adicionais?.length > 0 && (
        <fieldset>
          <legend>Adicionais</legend>
          {adicionais.map((a: any) => (
            <label key={a.id} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={extrasSelecionados.some((e) => e.nome === a.nome)}
                onChange={() => toggleExtra(a)}
              />
              {' '}{a.nome} — R$ {Number(a.preco).toFixed(2)}
            </label>
          ))}
        </fieldset>
      )}

      <label>Observações
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} style={{ width: '100%' }} />
      </label>

      <div style={{ margin: '8px 0' }}>
        Quantidade:
        <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
      </div>

      <p><strong>Preço unitário: R$ {precoUnitario.toFixed(2)}</strong></p>
      <button onClick={handleAdicionar}>Adicionar ao carrinho</button>
    </div>
  );
}