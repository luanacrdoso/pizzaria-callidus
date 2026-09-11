import { Link } from 'react-router-dom';
import { useCarrinhoStore } from '../api/carrinho';

export function CarrinhoPage() {
  const { itens, removerItem, alterarQuantidade } = useCarrinhoStore();
  const subtotal = itens.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);

  if (itens.length === 0) {
    return (
      <div className="text-center" style={{ padding: 60 }}>
        <p>Seu carrinho está vazio.</p>
        <Link to="/"><button>Ver Cardápio</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Seu Carrinho</h1>
      <div className="carrinho-grid">
        <div>
          {itens.map((item, i) => (
            <div key={i} className="card-simples item-carrinho">
              {item.imagemUrl
                ? <img src={item.imagemUrl} alt={item.nome} className="item-carrinho-img" />
                : <div className="item-carrinho-img" style={{ background: 'var(--cream-2)' }} />}
              <div style={{ flex: 1 }}>
                <strong>{item.nome}</strong>
                <div className="subtext">Tamanho: {item.tamanho}</div>
                {item.extras.length > 0 && <div className="subtext">+ {item.extras.join(', ')}</div>}
                {item.observacoes && <div className="subtext">Obs: {item.observacoes}</div>}
                <div style={{ fontWeight: 700, marginTop: 4 }}>Preço Unitário: R$ {item.precoUnitario.toFixed(2)}</div>
              </div>
              <div className="stepper-qtd">
                <button onClick={() => alterarQuantidade(i, Math.max(1, item.quantidade - 1))}>-</button>
                <span>{item.quantidade}</span>
                <button onClick={() => alterarQuantidade(i, item.quantidade + 1)}>+</button>
              </div>
              <button className="btn-link" onClick={() => removerItem(i)}>Remover</button>
            </div>
          ))}
        </div>

        <div className="resumo-pedido">
          <h3>Resumo do Pedido</h3>
          <div className="resumo-linha"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          <div className="resumo-linha"><span>Taxa de entrega (se aplicável)</span><span>calculada no checkout</span></div>
          <div className="resumo-linha total"><span>Total estimado</span><span>R$ {subtotal.toFixed(2)}</span></div>
          <Link to="/checkout"><button className="cta-fixo">Prosseguir →</button></Link>
        </div>
      </div>
    </div>
  );
}