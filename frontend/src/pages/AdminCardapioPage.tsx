import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarPizzas, criarPizza, editarPizza, excluirPizza, buscarPizzaPorId } from '../api/pizzas';
import { buscarAdicionais, criarAdicional, excluirAdicional } from '../api/adicionais';
import { buscarCategorias, criarCategoria, excluirCategoria } from '../api/categorias';
import { buscarPromocoes, criarPromocao, editarPromocao, excluirPromocao } from '../api/promocoes';

const TIPOS = [
  { valor: 'sabor_unico', rotulo: 'Sabor único (pizza, bebida, item avulso)' },
  { valor: 'personalizavel', rotulo: 'Pizza personalizável (múltiplos sabores)' },
];

const ABAS = [
  { chave: 'produto', rotulo: '➕ Novo Produto' },
  { chave: 'categorias', rotulo: '📂 Categorias' },
  { chave: 'adicionais', rotulo: '🥓 Adicionais' },
  { chave: 'promocoes', rotulo: '🎉 Promoções' },
] as const;

const vazio = {
  id: null as number | null,
  nome: '',
  descricao: '',
  categoria_id: '',
  imagem_url: '',
  preco_brotinho: '',
  preco_media: '',
  preco_grande: '',
  tipo: 'sabor_unico',
  max_sabores_brotinho: '',
  max_sabores_media: '',
  max_sabores_grande: '',
  sabores_permitidos: [] as number[],
};

const vazioPromo = {
  id: null as number | null,
  tipo: 'combo' as 'combo' | 'desconto_produto',
  nome: '',
  descricao: '',
  imagem_url: '',
  preco_combo: '',
  pizza_id: '',
  desconto_tipo: 'percentual' as 'percentual' | 'valor_fixo',
  desconto_valor: '',
  combo_slots: [] as { categoria_id: string; quantidade: number; rotulo: string }[],
  ativa: true,
};

export function AdminCardapioPage() {
  const queryClient = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState<typeof ABAS[number]['chave']>('produto');

  const [form, setForm] = useState(vazio);
  const [nomeAdicional, setNomeAdicional] = useState('');
  const [precoAdicional, setPrecoAdicional] = useState('');
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [formPromo, setFormPromo] = useState(vazioPromo);

  // Consultas da API
  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['pizzas'], queryFn: buscarPizzas });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });
  const { data: promocoes } = useQuery({ queryKey: ['promocoes'], queryFn: buscarPromocoes });

  const invalidarPizzas = () => queryClient.invalidateQueries({ queryKey: ['pizzas'] });

  // Mutations — produtos
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

  // Mutations — adicionais
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

  // Mutations — categorias
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

  // Mutations — promoções
  const mutationCriarPromocao = useMutation({
    mutationFn: criarPromocao,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promocoes'] }); limparFormPromo(); }
  });
  const mutationEditarPromocao = useMutation({
    mutationFn: editarPromocao,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promocoes'] }); limparFormPromo(); }
  });
  const mutationToggleAtivaPromocao = useMutation({
    mutationFn: editarPromocao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promocoes'] })
  });
  const mutationExcluirPromocao = useMutation({
    mutationFn: excluirPromocao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promocoes'] })
  });

  const saboresDisponiveis = (pizzas ?? []).filter((p: any) => p.tipo === 'sabor_unico');

  const limparForm = () => setForm(vazio);
  const limparFormPromo = () => setFormPromo(vazioPromo);

  const handleEditarClick = async (pizza: any) => {
    setAbaAtiva('produto');
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
        tipo: detalhe.tipo || 'sabor_unico',
        max_sabores_brotinho: String(detalhe.max_sabores_brotinho ?? ''),
        max_sabores_media: String(detalhe.max_sabores_media ?? ''),
        max_sabores_grande: String(detalhe.max_sabores_grande ?? ''),
        sabores_permitidos: detalhe.sabores_permitidos ?? [],
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
    };

    if (form.tipo === 'personalizavel') {
      dados.max_sabores_brotinho = form.max_sabores_brotinho ? Number(form.max_sabores_brotinho) : null;
      dados.max_sabores_media = form.max_sabores_media ? Number(form.max_sabores_media) : null;
      dados.max_sabores_grande = form.max_sabores_grande ? Number(form.max_sabores_grande) : null;
      dados.sabores_permitidos = form.sabores_permitidos;
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

  // ---- Promoções ----
  const adicionarSlotPromo = () => setFormPromo((f) => ({
    ...f, combo_slots: [...f.combo_slots, { categoria_id: '', quantidade: 1, rotulo: '' }]
  }));
  const removerSlotPromo = (i: number) => setFormPromo((f) => ({
    ...f, combo_slots: f.combo_slots.filter((_, idx) => idx !== i)
  }));
  const atualizarSlotPromo = (i: number, campo: string, valor: any) => setFormPromo((f) => ({
    ...f, combo_slots: f.combo_slots.map((s, idx) => idx === i ? { ...s, [campo]: valor } : s)
  }));

  const handleEditarPromocaoClick = (promo: any) => {
    setFormPromo({
      id: promo.id,
      tipo: promo.tipo,
      nome: promo.nome || '',
      descricao: promo.descricao ?? '',
      imagem_url: promo.imagem_url ?? '',
      preco_combo: String(promo.preco_combo ?? ''),
      pizza_id: String(promo.pizza_id ?? ''),
      desconto_tipo: promo.desconto_tipo || 'percentual',
      desconto_valor: String(promo.desconto_valor ?? ''),
      combo_slots: promo.combo_slots ?? [],
      ativa: promo.ativa,
    });
  };

  const handleSalvarPromocao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPromo.nome) { alert('Preencha o nome da promoção!'); return; }

    if (formPromo.id) {
      // Edição: backend só aceita atualizar nome/descrição/imagem/preço/desconto — não os itens do combo.
      const dados: any = {
        id: formPromo.id,
        nome: formPromo.nome.trim(),
        descricao: formPromo.descricao?.trim() || '',
        imagem_url: formPromo.imagem_url?.trim() || '',
        ativa: formPromo.ativa,
      };
      if (formPromo.tipo === 'combo') {
        dados.preco_combo = formPromo.preco_combo ? parseFloat(formPromo.preco_combo) : 0;
      } else {
        dados.desconto_tipo = formPromo.desconto_tipo;
        dados.desconto_valor = formPromo.desconto_valor ? parseFloat(formPromo.desconto_valor) : 0;
      }
      mutationEditarPromocao.mutate(dados);
      return;
    }

    // Criação
    const dados: any = {
      tipo: formPromo.tipo,
      nome: formPromo.nome.trim(),
      descricao: formPromo.descricao?.trim() || '',
      imagem_url: formPromo.imagem_url?.trim() || '',
    };

    if (formPromo.tipo === 'combo') {
      dados.preco_combo = formPromo.preco_combo ? parseFloat(formPromo.preco_combo) : 0;
      dados.combo_slots = formPromo.combo_slots
        .filter((s) => s.categoria_id)
        .map((s) => ({ categoria_id: Number(s.categoria_id), quantidade: Number(s.quantidade), rotulo: s.rotulo }));
      if (dados.combo_slots.length === 0) { alert('Adicione pelo menos um item ao combo.'); return; }
    } else {
      if (!formPromo.pizza_id) { alert('Selecione o produto que vai receber o desconto.'); return; }
      dados.pizza_id = Number(formPromo.pizza_id);
      dados.desconto_tipo = formPromo.desconto_tipo;
      dados.desconto_valor = formPromo.desconto_valor ? parseFloat(formPromo.desconto_valor) : 0;
    }

    mutationCriarPromocao.mutate(dados);
  };

  const handleToggleAtivaPromocao = (promo: any) =>
    mutationToggleAtivaPromocao.mutate({ ...promo, ativa: !promo.ativa });

  const nomeCategoriaPorId = (catId: number) => categorias?.find((c: any) => c.id === catId)?.nome ?? '';

  if (isLoading) return <p className="subtext" style={{ padding: 24 }}>Carregando cardápio...</p>;
  if (isError) return <div className="mensagem-erro-box">Erro ao carregar o cardápio.</div>;

  return (
    <div>
      <h1>🍕 Cardápio (Admin)</h1>

      {/* ===== ABAS ===== */}
      <div className="filtros-cardapio" style={{ marginBottom: 24 }}>
        {ABAS.map((aba) => (
          <button
            key={aba.chave}
            type="button"
            onClick={() => setAbaAtiva(aba.chave)}
            className={`categoria-pill ${abaAtiva === aba.chave ? 'ativa' : ''}`}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {/* ===== ABA: NOVO PRODUTO ===== */}
      {abaAtiva === 'produto' && (
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
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

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ flex: 1 }}>{form.id ? 'Salvar Alterações' : 'Gravar no Cardápio'}</button>
            {form.id && <button type="button" onClick={limparForm} className="btn-secundario">Cancelar</button>}
          </div>
        </form>
      )}

      {/* ===== ABA: CATEGORIAS ===== */}
      {abaAtiva === 'categorias' && (
        <div style={{ maxWidth: 460 }}>
          <form onSubmit={handleCriarCategoria} className="form-crud" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} placeholder="Nova categoria" style={{ flex: 1 }} />
            <button type="submit">Adicionar</button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {categorias?.map((c: any) => (
              <li key={c.id} className="card-simples" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, marginBottom: 8 }}>
                <strong>{c.nome}</strong>
                <button onClick={() => mutationExcluirCategoria.mutate(c.id)} className="btn-perigo" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== ABA: ADICIONAIS ===== */}
      {abaAtiva === 'adicionais' && (
        <div style={{ maxWidth: 460 }}>
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
      )}

      {/* ===== ABA: PROMOÇÕES ===== */}
      {abaAtiva === 'promocoes' && (
        <div style={{ maxWidth: 460 }}>
          <form onSubmit={handleSalvarPromocao} className="form-crud" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <h3>{formPromo.id ? '✏️ Editar Promoção' : '➕ Nova Promoção'}</h3>

            <select
              value={formPromo.tipo}
              onChange={(e) => setFormPromo({ ...formPromo, tipo: e.target.value as any })}
              disabled={!!formPromo.id}
            >
              <option value="combo">Combo</option>
              <option value="desconto_produto">Desconto em Produto</option>
            </select>

            <input value={formPromo.nome} onChange={(e) => setFormPromo({ ...formPromo, nome: e.target.value })} placeholder="Nome da promoção" />
            <input value={formPromo.descricao} onChange={(e) => setFormPromo({ ...formPromo, descricao: e.target.value })} placeholder="Descrição (opcional)" />
            <input value={formPromo.imagem_url} onChange={(e) => setFormPromo({ ...formPromo, imagem_url: e.target.value })} placeholder="URL da imagem (opcional)" />

            {formPromo.tipo === 'combo' ? (
              <>
                <input type="number" step="0.10" value={formPromo.preco_combo} onChange={(e) => setFormPromo({ ...formPromo, preco_combo: e.target.value })} placeholder="Preço fixo do combo (R$)" />

                {formPromo.id ? (
                  <div>
                    <span className="subtext">Itens do combo (não editáveis por aqui — excluam e recriem se precisarem mudar):</span>
                    <ul style={{ marginTop: 6 }}>
                      {formPromo.combo_slots.map((slot, i) => (
                        <li key={i} className="subtext">
                          {slot.quantidade}x {slot.rotulo || nomeCategoriaPorId(Number(slot.categoria_id))}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <>
                    <span className="subtext">Itens que compõem o combo:</span>
                    {formPromo.combo_slots.map((slot, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select value={slot.categoria_id} onChange={(e) => atualizarSlotPromo(i, 'categoria_id', e.target.value)}>
                          <option value="">Categoria</option>
                          {categorias?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        <input type="number" min={1} value={slot.quantidade} onChange={(e) => atualizarSlotPromo(i, 'quantidade', Number(e.target.value))} style={{ width: 55 }} />
                        <input value={slot.rotulo} onChange={(e) => atualizarSlotPromo(i, 'rotulo', e.target.value)} placeholder="Rótulo" />
                        <button type="button" onClick={() => removerSlotPromo(i)} className="btn-perigo" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>X</button>
                      </div>
                    ))}
                    <button type="button" onClick={adicionarSlotPromo} className="btn-secundario">+ Adicionar item ao combo</button>
                  </>
                )}
              </>
            ) : (
              <>
                <select value={formPromo.pizza_id} onChange={(e) => setFormPromo({ ...formPromo, pizza_id: e.target.value })} disabled={!!formPromo.id}>
                  <option value="">Selecione o produto...</option>
                  {pizzas?.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <select value={formPromo.desconto_tipo} onChange={(e) => setFormPromo({ ...formPromo, desconto_tipo: e.target.value as any })}>
                  <option value="percentual">Percentual (%)</option>
                  <option value="valor_fixo">Valor fixo (R$)</option>
                </select>
                <input type="number" step="0.01" value={formPromo.desconto_valor} onChange={(e) => setFormPromo({ ...formPromo, desconto_valor: e.target.value })} placeholder={formPromo.desconto_tipo === 'percentual' ? 'Ex: 10 (= 10%)' : 'Ex: 5.00'} />
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ flex: 1 }}>{formPromo.id ? 'Salvar Alterações' : 'Criar Promoção'}</button>
              {formPromo.id && <button type="button" onClick={limparFormPromo} className="btn-secundario">Cancelar</button>}
            </div>
          </form>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {promocoes?.map((promo: any) => (
              <li key={promo.id} className="card-simples" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 8, opacity: promo.ativa ? 1 : 0.5 }}>
                <button onClick={() => handleToggleAtivaPromocao(promo)} className="btn-secundario" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                  {promo.ativa ? '🟢' : '🔴'}
                </button>
                <span style={{ flex: 1 }}>
                  <strong>{promo.nome}</strong> — {promo.tipo === 'combo'
                    ? `Combo R$ ${Number(promo.preco_combo || 0).toFixed(2)}`
                    : `Desconto ${promo.desconto_tipo === 'percentual' ? promo.desconto_valor + '%' : 'R$ ' + Number(promo.desconto_valor).toFixed(2)}`}
                </span>
                <button onClick={() => handleEditarPromocaoClick(promo)} className="btn-secundario" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Editar</button>
                <button onClick={() => mutationExcluirPromocao.mutate(promo.id)} className="btn-perigo" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Excluir</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== CARDÁPIO ATUAL — sempre visível, embaixo de tudo ===== */}
      <h2 style={{ marginTop: 40 }}>Cardápio Atual</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pizzas?.map((pizza: any) => (
          <li key={pizza.id} className="card-simples" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10, opacity: pizza.visivel ? 1 : 0.5 }}>
            <button onClick={() => handleToggleVisivel(pizza)} title="Alternar visibilidade" className="btn-secundario" style={{ padding: '4px 8px' }}>
              {pizza.visivel ? '🟢 Visível' : '🔴 Oculto'}
            </button>
            <span style={{ flex: 1, fontWeight: 600 }}>
              {pizza.nome} ({pizza.categoria || 'Sem categoria'}) — {pizza.tipo === 'combo'
                ? `R$ ${Number(pizza.preco_combo || 0).toFixed(2)} (legado — recomendado excluir, combos agora ficam em Promoções)`
                : `R$ ${Number(pizza.preco_brotinho || 0).toFixed(2)} / ${Number(pizza.preco_media || 0).toFixed(2)} / ${Number(pizza.preco_grande || 0).toFixed(2)}`}
            </span>
            <button onClick={() => handleEditarClick(pizza)} className="btn-secundario" style={{ fontSize: '0.85rem' }}>Editar</button>
            <button onClick={() => mutationExcluir.mutate(pizza.id)} className="btn-perigo" style={{ fontSize: '0.85rem' }}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}