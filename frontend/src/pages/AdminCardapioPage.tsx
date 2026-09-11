import { useState } from 'react';
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
  nome: '', descricao: '', categoria_id: '', imagem_url: '',
  preco_brotinho: '', preco_media: '', preco_grande: '', preco_combo: '',
  tipo: 'sabor_unico',
  max_sabores_brotinho: '', max_sabores_media: '', max_sabores_grande: '',
  sabores_permitidos: [] as number[],
  combo_slots: [] as { categoria_id: string; quantidade: number; rotulo: string }[],
};

export function AdminCardapioPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [nomeAdicional, setNomeAdicional] = useState('');
  const [precoAdicional, setPrecoAdicional] = useState('');
  const [nomeCategoria, setNomeCategoria] = useState('');

  const { data: pizzas, isLoading, isError } = useQuery({ queryKey: ['pizzas'], queryFn: buscarPizzas });
  const { data: adicionais } = useQuery({ queryKey: ['adicionais'], queryFn: buscarAdicionais });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: buscarCategorias });

  const invalidarPizzas = () => queryClient.invalidateQueries({ queryKey: ['pizzas'] });

  const mutationCriar = useMutation({ mutationFn: criarPizza, onSuccess: () => { invalidarPizzas(); limparForm(); } });
  const mutationEditar = useMutation({ mutationFn: editarPizza, onSuccess: () => { invalidarPizzas(); limparForm(); } });
  const mutationExcluir = useMutation({ mutationFn: excluirPizza, onSuccess: invalidarPizzas });
  const mutationToggleVisivel = useMutation({ mutationFn: editarPizza, onSuccess: invalidarPizzas });

  const mutationCriarAdicional = useMutation({
    mutationFn: criarAdicional,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adicionais'] }); setNomeAdicional(''); setPrecoAdicional(''); }
  });
  const mutationExcluirAdicional = useMutation({
    mutationFn: excluirAdicional, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adicionais'] })
  });

  const mutationCriarCategoria = useMutation({
    mutationFn: criarCategoria,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categorias'] }); setNomeCategoria(''); }
  });
  const mutationExcluirCategoria = useMutation({
    mutationFn: excluirCategoria, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] })
  });

  const saboresDisponiveis = (pizzas ?? []).filter((p: any) => p.tipo === 'sabor_unico');

  const limparForm = () => setForm(vazio);

  const handleEditarClick = async (pizza: any) => {
    const detalhe = await buscarPizzaPorId(pizza.id);
    setForm({
      id: detalhe.id,
      nome: detalhe.nome, descricao: detalhe.descricao ?? '', categoria_id: String(detalhe.categoria_id ?? ''),
      imagem_url: detalhe.imagem_url ?? '',
      preco_brotinho: detalhe.preco_brotinho ?? '', preco_media: detalhe.preco_media ?? '', preco_grande: detalhe.preco_grande ?? '',
      preco_combo: detalhe.preco_combo ?? '',
      tipo: detalhe.tipo,
      max_sabores_brotinho: detalhe.max_sabores_brotinho ?? '', max_sabores_media: detalhe.max_sabores_media ?? '', max_sabores_grande: detalhe.max_sabores_grande ?? '',
      sabores_permitidos: detalhe.sabores_permitidos ?? [],
      combo_slots: (detalhe.combo_slots ?? []).map((s: any) => ({ categoria_id: String(s.categoria_id), quantidade: s.quantidade, rotulo: s.rotulo ?? '' })),
    });
  };

  const toggleSabor = (id: number) => {
    setForm((f) => ({
      ...f,
      sabores_permitidos: f.sabores_permitidos.includes(id)
        ? f.sabores_permitidos.filter((s) => s !== id)
        : [...f.sabores_permitidos, id]
    }));
  };

  const adicionarSlot = () => setForm((f) => ({ ...f, combo_slots: [...f.combo_slots, { categoria_id: '', quantidade: 1, rotulo: '' }] }));
  const removerSlot = (i: number) => setForm((f) => ({ ...f, combo_slots: f.combo_slots.filter((_, idx) => idx !== i) }));
  const atualizarSlot = (i: number, campo: string, valor: any) =>
    setForm((f) => ({ ...f, combo_slots: f.combo_slots.map((s, idx) => idx === i ? { ...s, [campo]: valor } : s) }));

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.categoria_id) return;

    const dados: any = {
      nome: form.nome, descricao: form.descricao, categoria_id: Number(form.categoria_id), imagem_url: form.imagem_url,
      tipo: form.tipo,
      preco_brotinho: form.preco_brotinho || null,
      preco_media: form.preco_media || null,
      preco_grande: form.preco_grande || null,
      preco_combo: form.preco_combo || null,
    };

    if (form.tipo === 'personalizavel') {
      dados.max_sabores_brotinho = form.max_sabores_brotinho || null;
      dados.max_sabores_media = form.max_sabores_media || null;
      dados.max_sabores_grande = form.max_sabores_grande || null;
      dados.sabores_permitidos = form.sabores_permitidos;
    }

    if (form.tipo === 'combo') {
      dados.combo_slots = form.combo_slots
        .filter((s) => s.categoria_id)
        .map((s) => ({ categoria_id: Number(s.categoria_id), quantidade: s.quantidade, rotulo: s.rotulo }));
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

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;

  return (
    <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
      <div style={{ flex: 2, minWidth: 340 }}>
        <h1>Cardápio (Admin)</h1>

        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, marginBottom: 24 }}>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do produto" required />

          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>

          <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} required>
            <option value="">Selecione a categoria</option>
            {categorias?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição" />
          <input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="URL da imagem" />

          {form.tipo !== 'combo' && (
            <>
              <input type="number" step="0.10" value={form.preco_brotinho} onChange={(e) => setForm({ ...form, preco_brotinho: e.target.value })} placeholder="Preço Brotinho" />
              <input type="number" step="0.10" value={form.preco_media} onChange={(e) => setForm({ ...form, preco_media: e.target.value })} placeholder="Preço Média" />
              <input type="number" step="0.10" value={form.preco_grande} onChange={(e) => setForm({ ...form, preco_grande: e.target.value })} placeholder="Preço Grande" />
            </>
          )}

          {form.tipo === 'personalizavel' && (
            <fieldset>
              <legend>Máximo de sabores por tamanho</legend>
              <input type="number" min={1} value={form.max_sabores_brotinho} onChange={(e) => setForm({ ...form, max_sabores_brotinho: e.target.value })} placeholder="Brotinho" />
              <input type="number" min={1} value={form.max_sabores_media} onChange={(e) => setForm({ ...form, max_sabores_media: e.target.value })} placeholder="Média" />
              <input type="number" min={1} value={form.max_sabores_grande} onChange={(e) => setForm({ ...form, max_sabores_grande: e.target.value })} placeholder="Grande" />

              <legend style={{ marginTop: 8 }}>Sabores permitidos</legend>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
                {saboresDisponiveis.map((s: any) => (
                  <label key={s.id} style={{ display: 'block' }}>
                    <input type="checkbox" checked={form.sabores_permitidos.includes(s.id)} onChange={() => toggleSabor(s.id)} />
                    {' '}{s.nome}
                  </label>
                ))}
                {saboresDisponiveis.length === 0 && <p style={{ fontSize: 12, color: '#888' }}>Cadastre primeiro pizzas de sabor único pra poder usá-las aqui.</p>}
              </div>
            </fieldset>
          )}

          {form.tipo === 'combo' && (
            <fieldset>
              <legend>Preço fixo do combo</legend>
              <input type="number" step="0.10" value={form.preco_combo} onChange={(e) => setForm({ ...form, preco_combo: e.target.value })} placeholder="Preço do combo" />

              <legend style={{ marginTop: 8 }}>Itens que compõem o combo</legend>
              {form.combo_slots.map((slot, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <select value={slot.categoria_id} onChange={(e) => atualizarSlot(i, 'categoria_id', e.target.value)}>
                    <option value="">Categoria</option>
                    {categorias?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <input type="number" min={1} value={slot.quantidade} onChange={(e) => atualizarSlot(i, 'quantidade', Number(e.target.value))} style={{ width: 50 }} />
                  <input value={slot.rotulo} onChange={(e) => atualizarSlot(i, 'rotulo', e.target.value)} placeholder="Rótulo (ex: Escolha a bebida)" />
                  <button type="button" onClick={() => removerSlot(i)}>Remover</button>
                </div>
              ))}
              <button type="button" onClick={adicionarSlot}>+ Adicionar item ao combo</button>
              <p style={{ fontSize: 12, color: '#888' }}>
                Ex: "2 pizzas" = 1 item, categoria Pizza, quantidade 2. "1 pizza + 1 bebida" = 2 itens: Pizza qtd 1, Bebida qtd 1.
              </p>
            </fieldset>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">{form.id ? 'Salvar Alterações' : 'Gravar no Cardápio'}</button>
            {form.id && <button type="button" onClick={limparForm}>Cancelar</button>}
          </div>
        </form>

        <h2>Cardápio Atual</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pizzas?.map((pizza: any) => (
            <li key={pizza.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, opacity: pizza.visivel ? 1 : 0.5 }}>
              <button onClick={() => handleToggleVisivel(pizza)} title="Alternar visibilidade">
                {pizza.visivel ? '🟢' : '🔴'}
              </button>
              <span style={{ flex: 1 }}>
                {pizza.nome} ({pizza.categoria}) — {pizza.tipo === 'combo'
                  ? `R$ ${pizza.preco_combo}`
                  : `R$ ${pizza.preco_brotinho} / ${pizza.preco_media} / ${pizza.preco_grande}`}
              </span>
              <button onClick={() => handleEditarClick(pizza)}>Editar</button>
              <button onClick={() => mutationExcluir.mutate(pizza.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1, minWidth: 260 }}>
        <h2>Categorias</h2>
        <form onSubmit={handleCriarCategoria} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} placeholder="Nova categoria" />
          <button type="submit">Adicionar</button>
        </form>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
          {categorias?.map((c: any) => (
            <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{c.nome}</span>
              <button onClick={() => mutationExcluirCategoria.mutate(c.id)}>Remover</button>
            </li>
          ))}
        </ul>

        <h2>Adicionais</h2>
        <form onSubmit={handleCriarAdicional} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <input value={nomeAdicional} onChange={(e) => setNomeAdicional(e.target.value)} placeholder="Nome do adicional" />
          <input value={precoAdicional} onChange={(e) => setPrecoAdicional(e.target.value)} placeholder="Preço" type="number" step="0.05" />
          <button type="submit">Adicionar</button>
        </form>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {adicionais?.map((a: any) => (
            <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{a.nome} — R$ {a.preco}</span>
              <button onClick={() => mutationExcluirAdicional.mutate(a.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}