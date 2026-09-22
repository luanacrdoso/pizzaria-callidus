import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarPizzas, criarPizza, editarPizza, excluirPizza, buscarPizzaPorId } from '../api/pizzas';
import { buscarAdicionais, criarAdicional, excluirAdicional } from '../api/adicionais';
import { buscarCategorias, criarCategoria, excluirCategoria } from '../api/categorias';

const TIPOS = [
  { valor: 'sabor_unico', rotulo: 'Sabor único (pizza, bebida, item avulso)' },
  { valor: 'personalizavel', rotulo: 'Pizza personalizável (múltiplos sabores)' },
  { valor: 'combo', rotulo: 'Combo' },
];

const vazio = {
  id: null as number | null,
  nome: '',
  descricao: '',
  categoria_id: '',
  imagem_url: '',
  preco_brotinho: '',
  preco_media: '',
  preco_grande: '',
  preco_combo: '',
  tipo: 'sabor_unico',
  max_sabores_brotinho: '',
  max_sabores_media: '',
  max_sabores_grande: '',
  sabores_permitidos: [] as number[],
  combo_slots: [] as { categoria_id: string; quantidade: number; rotulo: string }[],
};

export function AdminCardapioPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [nomeAdicional, setNomeAdicional] = useState('');
  const [precoAdicional, setPrecoAdicional] = useState('');
  const [nomeCategoria, setNomeCategoria] = useState('');

  // Consultas da API
  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['pizzas'], queryFn: buscarPizzas });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const invalidarPizzas = () => queryClient.invalidateQueries({ queryKey: ['pizzas'] });

  // Mutations
  const mutationCriar = useMutation({
    mutationFn: criarPizza,
    onSuccess: () => { invalidarPizzas(); limparForm(); }
  });

  const mutationEditar = useMutation({
    mutationFn: editarPizza,
    onSuccess: () => { invalidarPizzas(); limparForm(); }
  });

  const mutationExcluir = useMutation({
    mutationFn: excluirPizza,
    onSuccess: invalidarPizzas
  });

  const mutationToggleVisivel = useMutation({
    mutationFn: editarPizza,
    onSuccess: invalidarPizzas
  });

  const mutationCriarAdicional = useMutation({
    mutationFn: criarAdicional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adicionais'] });
      setNomeAdicional('');
      setPrecoAdicional('');
    }
  });

  const mutationExcluirAdicional = useMutation({
    mutationFn: excluirAdicional,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adicionais'] })
  });

  const mutationCriarCategoria = useMutation({
    mutationFn: criarCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setNomeCategoria('');
    }
  });

  const mutationExcluirCategoria = useMutation({
    mutationFn: excluirCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] })
  });

  const saboresDisponiveis = (pizzas ?? []).filter((p: any) => p.tipo === 'sabor_unico');

  const limparForm = () => setForm(vazio);

  const handleEditarClick = async (pizza: any) => {
    try {
      const detalhe = await buscarPizzaPorId(pizza.id);
      setForm({
        id: detalhe.id,
        nome: detalhe.nome || '',
        descricao: detalhe.descricao ?? '',
        categoria_id: String(detalhe.categoria_id ?? ''),
        imagem_url: detalhe.imagem_url ?? '',
        preco_brotinho: String(detalhe.preco_brotinho ?? ''),
        preco_media: String(detalhe.preco_media ?? ''),
        preco_grande: String(detalhe.preco_grande ?? ''),
        preco_combo: String(detalhe.preco_combo ?? ''),
        tipo: detalhe.tipo || 'sabor_unico',
        max_sabores_brotinho: String(detalhe.max_sabores_brotinho ?? ''),
        max_sabores_media: String(detalhe.max_sabores_media ?? ''),
        max_sabores_grande: String(detalhe.max_sabores_grande ?? ''),
        sabores_permitidos: detalhe.sabores_permitidos ?? [],
        combo_slots: (detalhe.combo_slots ?? []).map((s: any) => ({
          categoria_id: String(s.categoria_id),
          quantidade: s.quantidade,
          rotulo: s.rotulo ?? ''
        })),
      });
    } catch {
      setForm({
        ...vazio,
        id: pizza.id,
        nome: pizza.nome || '',
        categoria_id: String(pizza.categoria_id ?? ''),
        preco_brotinho: String(pizza.preco_brotinho ?? ''),
        preco_media: String(pizza.preco_media ?? ''),
        preco_grande: String(pizza.preco_grande ?? ''),
      });
    }
  };

  const toggleSabor = (id: number) => {
    setForm((f) => ({
      ...f,
      sabores_permitidos: f.sabores_permitidos.includes(id)
        ? f.sabores_permitidos.filter((s) => s !== id)
        : [...f.sabores_permitidos, id]
    }));
  };

  const adicionarSlot = () => setForm((f) => ({
    ...f,
    combo_slots: [...f.combo_slots, { categoria_id: '', quantidade: 1, rotulo: '' }]
  }));

  const removerSlot = (i: number) => setForm((f) => ({
    ...f,
    combo_slots: f.combo_slots.filter((_, idx) => idx !== i)
  }));

  const atualizarSlot = (i: number, campo: string, valor: any) =>
    setForm((f) => ({
      ...f,
      combo_slots: f.combo_slots.map((s, idx) => idx === i ? { ...s, [campo]: valor } : s)
    }));

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) {
      alert('Preencha o nome do produto!');
      return;
    }

    const catEncontrada = categorias?.find((c: any) => String(c.id) === String(form.categoria_id));
    const nomeCategoriaTexto = catEncontrada?.nome || 'Tradicional';

    const dados: any = {
      nome: form.nome.trim(),
      descricao: form.descricao?.trim() || '',
      categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined,
      categoria: nomeCategoriaTexto,
      imagem_url: form.imagem_url?.trim() || '',
      tipo: form.tipo || 'sabor_unico',
      preco_brotinho: form.preco_brotinho ? parseFloat(form.preco_brotinho) : 0,
      preco_media: form.preco_media ? parseFloat(form.preco_media) : 0,
      preco_grande: form.preco_grande ? parseFloat(form.preco_grande) : 0,
      preco_combo: form.preco_combo ? parseFloat(form.preco_combo) : 0,
    };

    if (form.tipo === 'personalizavel') {
      dados.max_sabores_brotinho = form.max_sabores_brotinho ? Number(form.max_sabores_brotinho) : null;
      dados.max_sabores_media = form.max_sabores_media ? Number(form.max_sabores_media) : null;
      dados.max_sabores_grande = form.max_sabores_grande ? Number(form.max_sabores_grande) : null;
      dados.sabores_permitidos = form.sabores_permitidos;
    }

    if (form.tipo === 'combo') {
      dados.combo_slots = form.combo_slots
        .filter((s) => s.categoria_id)
        .map((s) => ({
          categoria_id: Number(s.categoria_id),
          quantidade: Number(s.quantidade),
          rotulo: s.rotulo
        }));
    }

    if (form.id) {
      mutationEditar.mutate({ ...dados, id: form.id, visivel: true });
    } else {
      mutationCriar.mutate(dados);
    }
  };

  const handleToggleVisivel = (pizza: any) => mutationToggleVisivel.mutate({ ...pizza, visivel: !pizza.visivel });

  const handleCriarAdicional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAdicional || !precoAdicional) return;
    mutationCriarAdicional.mutate({ nome: nomeAdicional, preco: Number(precoAdicional) });
  };

  const handleCriarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCategoria) return;
    mutationCriarCategoria.mutate(nomeCategoria);
  };

  if (isLoading) return <p className="subtext" style={{ padding: 24 }}>Carregando cardápio...</p>;
  if (isError) return <div className="mensagem-erro-box">Erro ao carregar o cardápio.</div>;

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      {/* COLUNA ESQUERDA - CADASTRO DE PRODUTOS */}
      <div style={{ flex: 2, minWidth: 340 }}>
        <h1>🍕 Cardápio (Admin)</h1>

        <form onSubmit={handleSalvar} className="form-crud" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460, marginBottom: 32 }}>
          <h3>{form.id ? '✏️ Editar Produto' : '➕ Novo Produto'}</h3>

          <div className="input-group">
            <label>Nome do produto *</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Margherita Especial" required />
          </div>

          <div className="input-group">
            <label>Tipo de Produto *</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Categoria *</label>
            <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} required>
              <option value="">Selecione a categoria...</option>
              {categorias?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Descrição</label>
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Molho de tomate, muçarela..." />
          </div>

          <div className="input-group">
            <label>URL da imagem</label>
            <input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." />
          </div>

          {form.tipo !== 'combo' && (
            <div className="cores-flex" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="input-group">
                <label>Preço Brotinho (R$)</label>
                <input type="number" step="0.10" value={form.preco_brotinho} onChange={(e) => setForm({ ...form, preco_brotinho: e.target.value })} placeholder="35.00" />
              </div>
              <div className="input-group">
                <label>Preço Média (R$)</label>
                <input type="number" step="0.10" value={form.preco_media} onChange={(e) => setForm({ ...form, preco_media: e.target.value })} placeholder="45.00" />
              </div>
              <div className="input-group">
                <label>Preço Grande (R$)</label>
                <input type="number" step="0.10" value={form.preco_grande} onChange={(e) => setForm({ ...form, preco_grande: e.target.value })} placeholder="55.00" />
              </div>
            </div>
          )}

          {form.tipo === 'personalizavel' && (
            <fieldset style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
              <legend style={{ fontWeight: 700, padding: '0 6px', color: 'var(--ink)' }}>Máximo de sabores por tamanho</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <input type="number" min={1} value={form.max_sabores_brotinho} onChange={(e) => setForm({ ...form, max_sabores_brotinho: e.target.value })} placeholder="Brotinho (Ex: 1)" />
                <input type="number" min={1} value={form.max_sabores_media} onChange={(e) => setForm({ ...form, max_sabores_media: e.target.value })} placeholder="Média (Ex: 2)" />
                <input type="number" min={1} value={form.max_sabores_grande} onChange={(e) => setForm({ ...form, max_sabores_grande: e.target.value })} placeholder="Grande (Ex: 3)" />
              </div>

              <legend style={{ fontWeight: 700, padding: '0 6px', color: 'var(--ink)' }}>Sabores permitidos</legend>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', padding: 10, background: 'var(--cream-2)' }}>
                {saboresDisponiveis.map((s: any) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.sabores_permitidos.includes(s.id)} onChange={() => toggleSabor(s.id)} />
                    <span>{s.nome}</span>
                  </label>
                ))}
                {saboresDisponiveis.length === 0 && (
                  <p className="subtext">Cadastre primeiro pizzas de sabor único para poder selecioná-las aqui.</p>
                )}
              </div>
            </fieldset>
          )}

          {form.tipo === 'combo' && (
            <fieldset style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
              <legend style={{ fontWeight: 700, padding: '0 6px', color: 'var(--ink)' }}>Preço fixo do combo</legend>
              <input type="number" step="0.10" value={form.preco_combo} onChange={(e) => setForm({ ...form, preco_combo: e.target.value })} placeholder="Preço do combo (R$)" style={{ width: '100%', marginBottom: 12 }} />

              <legend style={{ fontWeight: 700, padding: '0 6px', color: 'var(--ink)' }}>Itens que compõem o combo</legend>
              {form.combo_slots.map((slot, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                  <select value={slot.categoria_id} onChange={(e) => atualizarSlot(i, 'categoria_id', e.target.value)}>
                    <option value="">Categoria</option>
                    {categorias?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <input type="number" min={1} value={slot.quantidade} onChange={(e) => atualizarSlot(i, 'quantidade', Number(e.target.value))} style={{ width: 60 }} />
                  <input value={slot.rotulo} onChange={(e) => atualizarSlot(i, 'rotulo', e.target.value)} placeholder="Ex: Escolha a bebida" />
                  <button type="button" onClick={() => removerSlot(i)} className="btn-perigo" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>X</button>
                </div>
              ))}
              <button type="button" onClick={adicionarSlot} className="btn-secundario" style={{ width: '100%', marginTop: 6 }}>+ Adicionar item ao combo</button>
            </fieldset>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ flex: 1 }}>{form.id ? 'Salvar Alterações' : 'Gravar no Cardápio'}</button>
            {form.id && <button type="button" onClick={limparForm} className="btn-secundario">Cancelar</button>}
          </div>
        </form>

        <h2>Cardápio Atual</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pizzas?.map((pizza: any) => (
            <li key={pizza.id} className="card-simples" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10, opacity: pizza.visivel ? 1 : 0.5 }}>
              <button onClick={() => handleToggleVisivel(pizza)} title="Alternar visibilidade" className="btn-secundario" style={{ padding: '4px 8px' }}>
                {pizza.visivel ? '🟢 Visível' : '🔴 Oculto'}
              </button>
              <span style={{ flex: 1, fontWeight: 600 }}>
                {pizza.nome} ({pizza.categoria || 'Sem categoria'}) — {pizza.tipo === 'combo'
                  ? `R$ ${Number(pizza.preco_combo || 0).toFixed(2)}`
                  : `R$ ${Number(pizza.preco_brotinho || 0).toFixed(2)} / ${Number(pizza.preco_media || 0).toFixed(2)} / ${Number(pizza.preco_grande || 0).toFixed(2)}`}
              </span>
              <button onClick={() => handleEditarClick(pizza)} className="btn-secundario" style={{ fontSize: '0.85rem' }}>Editar</button>
              <button onClick={() => mutationExcluir.mutate(pizza.id)} className="btn-perigo" style={{ fontSize: '0.85rem' }}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>

      {/* COLUNA DIREITA - CATEGORIAS & ADICIONAIS */}
      <div style={{ flex: 1, minWidth: 280 }}>
        <h2>📂 Categorias</h2>
        <form onSubmit={handleCriarCategoria} className="form-crud" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} placeholder="Nova categoria" style={{ flex: 1 }} />
          <button type="submit">Adicionar</button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
          {categorias?.map((c: any) => (
            <li key={c.id} className="card-simples" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, marginBottom: 8 }}>
              <strong>{c.nome}</strong>
              <button onClick={() => mutationExcluirCategoria.mutate(c.id)} className="btn-perigo" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Remover</button>
            </li>
          ))}
        </ul>

        <h2>🥓 Adicionais</h2>
        <form onSubmit={handleCriarAdicional} className="form-crud" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input value={nomeAdicional} onChange={(e) => setNomeAdicional(e.target.value)} placeholder="Nome do adicional" />
          <input value={precoAdicional} onChange={(e) => setPrecoAdicional(e.target.value)} placeholder="Preço" type="number" step="0.05" />
          <button type="submit">Adicionar</button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {adicionais?.map((a: any) => (
            <li key={a.id} className="card-simples" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, marginBottom: 8 }}>
              <span><strong>{a.nome}</strong> — R$ {Number(a.preco).toFixed(2)}</span>
              <button onClick={() => mutationExcluirAdicional.mutate(a.id)} className="btn-perigo" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Remover</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}