import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarrinhoStore } from '../api/carrinho';
import { obterTokenCliente, fetchComoCliente } from '../api/clienteAuth';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarConfig() { const r = await fetch(`${API_URL}/config`); return r.json(); }
async function buscarMesas() { const r = await fetch(`${API_URL}/mesas`); return r.json(); }
async function buscarMeuPerfil() {
  const r = await fetchComoCliente(`${API_URL}/clientes/meu-perfil`);
  if (!r.ok) return null;
  return r.json();
}

const OPCOES_TIPO = [
  { valor: 'entrega', rotulo: 'Entrega no meu endereço', icone: '🚗' },
  { valor: 'presencial', rotulo: 'Vou comer na pizzaria (presencial)', icone: '🍽️' },
  { valor: 'retirada', rotulo: 'Vou retirar no balcão', icone: '🛍️' },
];

const ICONES_PAGAMENTO: Record<string, string> = {
  'Cartão de Crédito': '💳', 'Cartão de Débito': '💳', 'Pix': '📱', 'Dinheiro': '💰',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { itens, limparCarrinho } = useCarrinhoStore();
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: buscarConfig });
  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: buscarMesas });

  const logado = !!obterTokenCliente();
  const { data: perfil } = useQuery({ queryKey: ['meu-perfil'], queryFn: buscarMeuPerfil, enabled: logado });

  const [tipoPedido, setTipoPedido] = useState<'entrega' | 'retirada' | 'presencial'>('entrega');
  const [mesaId, setMesaId] = useState('');
  const [incluirGorjeta, setIncluirGorjeta] = useState(false);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [cpfNota, setCpfNota] = useState('');
  const [codigoCupom, setCodigoCupom] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!perfil) return;
    setNome(perfil.nome ?? '');
    setTelefone(perfil.telefone ?? '');
    setCpfNota(perfil.cpf ?? '');
    const enderecoMontado = [perfil.endereco, perfil.numero && `nº ${perfil.numero}`, perfil.bairro, perfil.cidade, perfil.estado].filter(Boolean).join(', ');
    setEndereco(enderecoMontado);
  }, [perfil]);

  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const taxaEntrega = tipoPedido === 'entrega' ? Number(config?.taxa_entrega ?? 0) : 0;
  const gorjeta = tipoPedido === 'presencial' && incluirGorjeta ? Number((subtotal * 0.10).toFixed(2)) : 0;
  const total = Math.max(0, subtotal + taxaEntrega - desconto + gorjeta);

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
      cliente_nome: nome, cliente_telefone: telefone,
      endereco_entrega: tipoPedido === 'entrega' ? endereco : null,
      mesa_id: tipoPedido === 'presencial' && mesaId ? Number(mesaId) : null,
      cpf_nota: cpfNota || null,
      itens: itens.map((i) => ({ pizzaId: i.pizzaId, nome: i.nome, tamanho: i.tamanho, extras: i.extras, observacoes: i.observacoes, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
      subtotal, taxa_entrega: taxaEntrega, total,
      cupom_codigo: desconto > 0 ? codigoCupom.toUpperCase() : null, valor_desconto: desconto,
      gorjeta_valor: gorjeta,
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
    <div className="max-w-700">
      <h1>Finalizar Pedido</h1>

      <div className="secao-checkout">
        <h3>Como você quer receber seu pedido?</h3>
        {OPCOES_TIPO.map((op) => (
          <label key={op.valor} className={`radio-card ${tipoPedido === op.valor ? 'selecionado' : ''}`}>
            <input type="radio" checked={tipoPedido === op.valor} onChange={() => setTipoPedido(op.valor as any)} />
            <span>{op.icone}</span> {op.rotulo}
          </label>
        ))}
      </div>

      {tipoPedido === 'entrega' && (
        <div className="secao-checkout">
          <h3>Endereço de Entrega</h3>
          <label className="campo-label">Endereço completo</label>
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} style={{ width: '100%' }} />
        </div>
      )}

      {tipoPedido === 'presencial' && (
        <div className="secao-checkout">
          <h3>Mesa</h3>
          <select value={mesaId} onChange={(e) => setMesaId(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
            <option value="">A definir (ainda não sei / estou a caminho)</option>
            {mesas?.map((m: any) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={incluirGorjeta} onChange={(e) => setIncluirGorjeta(e.target.checked)} />
            Incluir gorjeta de 10% para o garçom
          </label>
        </div>
      )}

      <div className="secao-checkout">
        <h3>Seus Dados</h3>
        <label className="campo-label">Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <label className="campo-label">Telefone</label>
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div className="secao-checkout">
        <h3>Forma de Pagamento</h3>
        {(config?.formas_pagamento_aceitas ?? []).map((f: string) => (
          <label key={f} className={`radio-card ${formaPagamento === f ? 'selecionado' : ''}`}>
            <input type="radio" checked={formaPagamento === f} onChange={() => setFormaPagamento(f)} />
            <span>{ICONES_PAGAMENTO[f] ?? '💳'}</span> {f}
          </label>
        ))}
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input placeholder="Cupom de desconto" value={codigoCupom} onChange={(e) => setCodigoCupom(e.target.value)} />
          <button type="button" onClick={handleAplicarCupom} className="btn-secundario">Aplicar</button>
        </div>
      </div>

      <div className="secao-checkout">
        <h3>Nota Fiscal</h3>
        <label className="campo-label">CPF na nota (opcional)</label>
        <input placeholder="000.000.000-00" value={cpfNota} onChange={(e) => setCpfNota(e.target.value)} style={{ width: '100%' }} />
      </div>

      {erro && <p className="mensagem-erro-box">{erro}</p>}

      <div className="resumo-pedido" style={{ position: 'static' }}>
        <div className="resumo-linha"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
        <div className="resumo-linha"><span>Taxa de Entrega</span><span>R$ {taxaEntrega.toFixed(2)}</span></div>
        {desconto > 0 && <div className="resumo-linha"><span>Desconto</span><span>- R$ {desconto.toFixed(2)}</span></div>}
        {gorjeta > 0 && <div className="resumo-linha"><span>Gorjeta</span><span>R$ {gorjeta.toFixed(2)}</span></div>}
        <div className="resumo-linha total"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
        <button className="cta-fixo" onClick={handleFinalizar} disabled={!formaPagamento || itens.length === 0}>Confirmar Pedido</button>
      </div>
    </div>
  );
}