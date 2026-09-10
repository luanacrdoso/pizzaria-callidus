import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarrinhoStore } from '../api/carrinho';
import { obterTokenCliente, fetchComoCliente } from '../api/clienteAuth';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarConfig() {
  const r = await fetch(`${API_URL}/config`);
  return r.json();
}

async function buscarMeuPerfil() {
  const r = await fetchComoCliente(`${API_URL}/clientes/meu-perfil`);
  if (!r.ok) return null;
  return r.json();
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { itens, limparCarrinho } = useCarrinhoStore();
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: buscarConfig });

  const logado = !!obterTokenCliente();
  const { data: perfil } = useQuery({ queryKey: ['meu-perfil'], queryFn: buscarMeuPerfil, enabled: logado });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoPedido, setTipoPedido] = useState<'entrega' | 'retirada' | 'presencial'>('entrega');
  const [endereco, setEndereco] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [codigoCupom, setCodigoCupom] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [erro, setErro] = useState('');

  // Pré-preenche assim que o perfil do cliente logado chegar da API
  useEffect(() => {
    if (!perfil) return;
    setNome(perfil.nome ?? '');
    setTelefone(perfil.telefone ?? '');
    const enderecoMontado = [
      perfil.endereco, perfil.numero && `nº ${perfil.numero}`, perfil.bairro, perfil.cidade, perfil.estado
    ].filter(Boolean).join(', ');
    setEndereco(enderecoMontado);
  }, [perfil]);

  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const taxaEntrega = tipoPedido === 'entrega' ? Number(config?.taxa_entrega ?? 0) : 0;
  const total = Math.max(0, subtotal + taxaEntrega - desconto);

  const handleAplicarCupom = async () => {
    const r = await fetch(`${API_URL}/cupons/validar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: codigoCupom, subtotal, taxa_entrega: taxaEntrega })
    });
    if (!r.ok) { const e = await r.json(); setErro(e.mensagem); return; }
    const dados = await r.json();
    setDesconto(dados.valor_desconto);
    setErro('');
  };

  const handleFinalizar = async () => {
    const token = obterTokenCliente();
    const payload = {
      tipo: tipoPedido,
      cliente_id: logado && perfil ? perfil.id : null,
      cliente_nome: nome, cliente_telefone: telefone, endereco_entrega: endereco,
      itens: itens.map((i) => ({ pizzaId: i.pizzaId, nome: i.nome, tamanho: i.tamanho, extras: i.extras, observacoes: i.observacoes, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
      subtotal, taxa_entrega: taxaEntrega, total,
      cupom_codigo: desconto > 0 ? codigoCupom.toUpperCase() : null, valor_desconto: desconto,
      forma_pagamento: formaPagamento
    };
    const resposta = token
      ? await fetchComoCliente(`${API_URL}/pedidos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`${API_URL}/pedidos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!resposta.ok) { setErro("Erro ao criar o pedido."); return; }
    const pedido = await resposta.json();
    limparCarrinho();
    navigate(`/pagamento/${pedido.id}`, { state: { formaPagamento, total } });
  };

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>Checkout</h1>
      <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      <select value={tipoPedido} onChange={(e) => setTipoPedido(e.target.value as any)}>
        <option value="entrega">Entrega</option>
        <option value="retirada">Retirada no balcão</option>
        <option value="presencial">Vou comer no local</option>
      </select>

      {tipoPedido === 'entrega' && (
        <input placeholder="Endereço de entrega" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
    ) }
      <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
        <option value="">Forma de pagamento</option>
        {(config?.formas_pagamento_aceitas ?? []).map((f: string) => <option key={f} value={f}>{f}</option>)}
      </select>
      <div>
        <input placeholder="Cupom" value={codigoCupom} onChange={(e) => setCodigoCupom(e.target.value)} />
        <button type="button" onClick={handleAplicarCupom}>Aplicar</button>
      </div>
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
      <p>Entrega: R$ {taxaEntrega.toFixed(2)}</p>
      <p>Desconto: R$ {desconto.toFixed(2)}</p>
      <p><strong>Total: R$ {total.toFixed(2)}</strong></p>
      <button onClick={handleFinalizar} disabled={!formaPagamento || itens.length === 0}>Finalizar Pedido</button>
    </div>
  );
}