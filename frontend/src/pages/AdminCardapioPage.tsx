import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buscarPizzas, criarPizza, editarPizza, excluirPizza, type Pizza } from '../api/pizzas';
import { buscarAdicionais, criarAdicional, excluirAdicional } from '../api/adicionais';

const CATEGORIAS = ['Tradicional', 'Especial', 'Vegetariana', 'Doce', 'Bebida', 'Combo'];

export function AdminCardapioPage() {
  const queryClient = useQueryClient();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Tradicional');
  const [imagemUrl, setImagemUrl] = useState('');
  const [precoBrotinho, setPrecoBrotinho] = useState('');
  const [precoMedia, setPrecoMedia] = useState('');
  const [precoGrande, setPrecoGrande] = useState('');

  const [nomeAdicional, setNomeAdicional] = useState('');
  const [precoAdicional, setPrecoAdicional] = useState('');

  const { data: pizzas, isLoading, isError } = useQuery({
    queryKey: ['pizzas'],
    queryFn: buscarPizzas
  });

  const { data: adicionais } = useQuery({
    queryKey: ['adicionais'],
    queryFn: buscarAdicionais
  });

  const invalidarPizzas = () => queryClient.invalidateQueries({ queryKey: ['pizzas'] });

  const mutationCriar = useMutation({
    mutationFn: criarPizza,
    onSuccess: () => { invalidarPizzas(); limparFormulario(); }
  });

  const mutationEditar = useMutation({
    mutationFn: editarPizza,
    onSuccess: () => { invalidarPizzas(); limparFormulario(); }
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

  const limparFormulario = () => {
    setEditandoId(null);
    setNome('');
    setDescricao('');
    setImagemUrl('');
    setPrecoBrotinho('');
    setPrecoMedia('');
    setPrecoGrande('');
    setCategoria('Tradicional');
  };

  const handleEditarClick = (pizza: Pizza) => {
    setEditandoId(pizza.id);
    setNome(pizza.nome);
    setDescricao(pizza.descricao);
    setCategoria(pizza.categoria);
    setImagemUrl(pizza.imagem_url);
    setPrecoBrotinho(pizza.preco_brotinho);
    setPrecoMedia(pizza.preco_media);
    setPrecoGrande(pizza.preco_grande);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    const dados = {
      nome,
      descricao,
      categoria,
      imagem_url: imagemUrl,
      preco_brotinho: precoBrotinho,
      preco_media: precoMedia,
      preco_grande: precoGrande,
      tipo: 'sabor_unico'
    };

    if (editandoId) {
      mutationEditar.mutate({ ...dados, id: editandoId, visivel: true });
    } else {
      mutationCriar.mutate(dados);
    }
  };

  const handleToggleVisivel = (pizza: Pizza) => {
    mutationToggleVisivel.mutate({ ...pizza, visivel: !pizza.visivel });
  };

  const handleCriarAdicional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAdicional || !precoAdicional) return;
    mutationCriarAdicional.mutate({ nome: nomeAdicional, preco: Number(precoAdicional) });
  };

  if (isLoading) return <p>Carregando cardápio...</p>;
  if (isError) return <p>Erro ao carregar o cardápio.</p>;

  return (
    <div style={{ padding: 24, display: 'flex', gap: 40 }}>
      <div style={{ flex: 2 }}>
        <h1>Cardápio (Admin)</h1>

        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, marginBottom: 24 }}>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do produto" required />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" />
          <input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="URL da imagem" />
          <input value={precoBrotinho} onChange={(e) => setPrecoBrotinho(e.target.value)} placeholder="Preço Brotinho" type="number" step="0.10" />
          <input value={precoMedia} onChange={(e) => setPrecoMedia(e.target.value)} placeholder="Preço Média" type="number" step="0.10" />
          <input value={precoGrande} onChange={(e) => setPrecoGrande(e.target.value)} placeholder="Preço Grande" type="number" step="0.10" />

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">{editandoId ? 'Salvar Alterações' : 'Gravar no Cardápio'}</button>
            {editandoId && <button type="button" onClick={limparFormulario}>Cancelar</button>}
          </div>
        </form>

        <h2>Cardápio Atual</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pizzas?.map((pizza) => (
            <li key={pizza.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, opacity: pizza.visivel ? 1 : 0.5 }}>
              <button onClick={() => handleToggleVisivel(pizza)} title="Alternar visibilidade">
                {pizza.visivel ? '🟢' : '🔴'}
              </button>
              <span style={{ flex: 1 }}>
                {pizza.nome} ({pizza.categoria}) — R$ {pizza.preco_brotinho} / {pizza.preco_media} / {pizza.preco_grande}
              </span>
              <button onClick={() => handleEditarClick(pizza)}>Editar</button>
              <button onClick={() => mutationExcluir.mutate(pizza.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        <h2>Adicionais</h2>
        <form onSubmit={handleCriarAdicional} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <input value={nomeAdicional} onChange={(e) => setNomeAdicional(e.target.value)} placeholder="Nome do adicional" />
          <input value={precoAdicional} onChange={(e) => setPrecoAdicional(e.target.value)} placeholder="Preço" type="number" step="0.05" />
          <button type="submit">Adicionar</button>
        </form>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {adicionais?.map((a) => (
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