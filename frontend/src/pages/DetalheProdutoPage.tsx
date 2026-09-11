import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarrinhoStore } from '../api/carrinho';
import { calcularPrecoPizzaMultiplosSabores } from '../api/precos';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarPizza(id: string) {
  const r = await fetch(`${API_URL}/pizzas/${id}`);
  if (!r.ok) throw new Error('Erro ao buscar item.');
  return r.json();
}
async function buscarCardapioTodo() {
  const r = await fetch(`${API_URL}/pizzas?visivel=true`);
  return r.json();
}
async function buscarAdicionais() {
  const r = await fetch(`${API_URL}/adicionais`);
  return r.json();
}
async function buscarCategorias() {
  const r = await fetch(`${API_URL}/categorias`);
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
  const { data: cardapio } = useQuery({ queryKey: ['cardapio-publico'], queryFn: buscarCardapioTodo });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const [tamanho, setTamanho] = useState('media');
  const [saboresSelecionados, setSaboresSelecionados] = useState<number[]>([]);
  const [escolhasCombo, setEscolhasCombo] = useState<Record<number, string[]>>({});
  const [extrasSelecionados, setExtrasSelecionados] = useState<{ nome: string; preco: number }[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [erro, setErro] = useState('');

  if (isLoading) return <p>Carregando...</p>;
  if (isError || !pizza) return <p>Item não encontrado.</p>;

  const nomeCategoria = (catId: number) => categorias?.find((c: any) => c.id === catId)?.nome ?? '';

  const toggleExtra = (a: any) => {
    const jaTem = extrasSelecionados.some((e) => e.nome === a.nome);
    setExtrasSelecionados(jaTem ? extrasSelecionados.filter((e) => e.nome !== a.nome) : [...extrasSelecionados, { nome: a.nome, preco: Number(a.preco) }]);
  };

  const toggleSabor = (saborId: number) => {
    const max = Number(pizza[`max_sabores_${tamanho}`] ?? 99);
    setSaboresSelecionados((atual) => {
      if (atual.includes(saborId)) return atual.filter((s) => s !== saborId);
      if (atual.length >= max) return atual;
      return [...atual, saborId];
    });
  };

  const atualizarEscolhaCombo = (slotIndex: number, posicao: number, pizzaId: string) => {
    setEscolhasCombo((atual) => {
      const nova = [...(atual[slotIndex] ?? [])];
      nova[posicao] = pizzaId;
      return { ...atual, [slotIndex]: nova };
    });
  };

  const precoExtras = extrasSelecionados.reduce((s, e) => s + e.preco, 0);
  let precoUnitario = 0;
  let nomeFinal = pizza.nome;

  if (pizza.tipo === 'sabor_unico') {
    precoUnitario = Number(pizza[`preco_${tamanho}`] ?? 0) + precoExtras;
  } else if (pizza.tipo === 'personalizavel') {
    const saboresObjetos = saboresSelecionados.map((sid) => cardapio?.find((p: any) => p.id === sid)).filter(Boolean) as any[];
    const precos = saboresObjetos.map((s) => Number(s[`preco_${tamanho}`] ?? 0));
    precoUnitario = (precos.length > 0 ? calcularPrecoPizzaMultiplosSabores(precos) : 0) + precoExtras;
    if (saboresObjetos.length > 0) nomeFinal = `${pizza.nome}: ${saboresObjetos.map((s) => s.nome).join(' / ')}`;
  } else if (pizza.tipo === 'combo') {
    precoUnitario = Number(pizza.preco_combo ?? 0) + precoExtras;
  }

  const handleAdicionar = () => {
    if (pizza.tipo === 'personalizavel' && saboresSelecionados.length === 0) { setErro('Escolha pelo menos um sabor.'); return; }
    if (pizza.tipo === 'combo') {
      const slots = pizza.combo_slots ?? [];
      for (let i = 0; i < slots.length; i++) {
        const escolhas = escolhasCombo[i] ?? [];
        for (let pos = 0; pos < slots[i].quantidade; pos++) {
          if (!escolhas[pos]) { setErro('Complete todas as escolhas do combo.'); return; }
        }
      }
    }
    setErro('');
    adicionarItem({
      pizzaId: pizza.id, nome: nomeFinal, tamanho: pizza.tipo === 'combo' ? '-' : tamanho,
      extras: extrasSelecionados.map((e) => e.nome), observacoes, quantidade, precoUnitario,
      imagemUrl: pizza.imagem_url,
    });
    navigate('/carrinho');
  };

  return (
    <div>
      <Link to="/" className="voltar-link">← Voltar ao Cardápio</Link>
      <div className="detalhe-produto">
        {pizza.imagem_url && <img src={pizza.imagem_url} alt={pizza.nome} className="detalhe-produto-img" />}

        <div className="detalhe-produto-painel">
          <span className="pizza-card-tag">{pizza.categoria}</span>
          <h1>{pizza.nome}</h1>
          <p>{pizza.descricao}</p>
          <hr />

          {pizza.tipo === 'sabor_unico' && (
            <>
              <h3>Tamanho</h3>
              <div className="opcoes-grid">
                {TAMANHOS.filter((t) => pizza[`preco_${t.chave}`]).map((t) => (
                  <label key={t.chave} className={`opcao-card ${tamanho === t.chave ? 'selecionada' : ''}`}>
                    <input type="radio" checked={tamanho === t.chave} onChange={() => setTamanho(t.chave)} />
                    {t.rotulo}
                  </label>
                ))}
              </div>
            </>
          )}

          {pizza.tipo === 'personalizavel' && (
            <>
              <h3>Tamanho</h3>
              <div className="opcoes-grid">
                {TAMANHOS.filter((t) => pizza[`preco_${t.chave}`]).map((t) => (
                  <label key={t.chave} className={`opcao-card ${tamanho === t.chave ? 'selecionada' : ''}`}>
                    <input type="radio" checked={tamanho === t.chave} onChange={() => { setTamanho(t.chave); setSaboresSelecionados([]); }} />
                    {t.rotulo}
                  </label>
                ))}
              </div>
              <h3>Sabores (máx. {pizza[`max_sabores_${tamanho}`] ?? '—'})</h3>
              <div className="opcoes-grid">
                {(pizza.sabores_permitidos ?? []).map((saborId: number) => {
                  const sabor = cardapio?.find((p: any) => p.id === saborId);
                  if (!sabor) return null;
                  return (
                    <label key={saborId} className={`opcao-card ${saboresSelecionados.includes(saborId) ? 'selecionada' : ''}`}>
                      <input type="checkbox" checked={saboresSelecionados.includes(saborId)} onChange={() => toggleSabor(saborId)} />
                      {sabor.nome}
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {pizza.tipo === 'combo' && (
            <>
              <p><strong>Combo — R$ {Number(pizza.preco_combo ?? 0).toFixed(2)}</strong></p>
              {(pizza.combo_slots ?? []).map((slot: any, slotIndex: number) => (
                <div key={slotIndex} style={{ marginBottom: 12 }}>
                  <h3>{slot.rotulo || nomeCategoria(slot.categoria_id)}</h3>
                  {Array.from({ length: slot.quantidade }).map((_, pos) => (
                    <select key={pos} value={escolhasCombo[slotIndex]?.[pos] ?? ''} onChange={(e) => atualizarEscolhaCombo(slotIndex, pos, e.target.value)} style={{ marginRight: 8, marginBottom: 6 }}>
                      <option value="">Escolha {pos + 1}</option>
                      {cardapio?.filter((p: any) => p.categoria_id === slot.categoria_id && p.tipo !== 'combo').map((p: any) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  ))}
                </div>
              ))}
            </>
          )}

          {adicionais?.length > 0 && (
            <>
              <h3>Adicionais</h3>
              <div className="opcoes-grid">
                {adicionais.map((a: any) => (
                  <label key={a.id} className={`opcao-card ${extrasSelecionados.some((e) => e.nome === a.nome) ? 'selecionada' : ''}`}>
                    <input type="checkbox" checked={extrasSelecionados.some((e) => e.nome === a.nome)} onChange={() => toggleExtra(a)} />
                    {a.nome} (+R$ {Number(a.preco).toFixed(2)})
                  </label>
                ))}
              </div>
            </>
          )}

          <h3>Observações</h3>
          <textarea placeholder="Ex: sem cebola, caprichar no molho..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />

          <div style={{ marginTop: 16 }}>
            <span className="campo-label">Quantidade</span>
            <div className="stepper-qtd">
              <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>-</button>
              <span>{quantidade}</span>
              <button onClick={() => setQuantidade(quantidade + 1)}>+</button>
            </div>
          </div>

          {erro && <p className="mensagem-erro-box" style={{ marginTop: 12 }}>{erro}</p>}

          <button className="cta-fixo" onClick={handleAdicionar}>
            Adicionar ao Carrinho — R$ {(precoUnitario * quantidade).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}