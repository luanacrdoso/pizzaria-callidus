import { Link } from 'react-router-dom';
import { useCarrinhoStore } from '../api/carrinho.ts';

export function CarrinhoPage() {
  const { itens, removerItem, alterarQuantidade } = useCarrinhoStore();

  const subtotal = itens.reduce(
    (soma, i) => soma + i.precoUnitario * i.quantidade,
    0
  );

  if (itens.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <p>Seu carrinho está vazio.</p>
        <Link to="/">Ver cardápio</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Carrinho</h1>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {itens.map((item, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            {item.nome} ({item.tamanho}) x

            <input
              type="number"
              min={1}
              value={item.quantidade}
              onChange={(e) =>
                alterarQuantidade(i, Number(e.target.value))
              }
              style={{ width: 50, margin: "0 8px" }}
            />

            R$ {(item.precoUnitario * item.quantidade).toFixed(2)}

            <button
              onClick={() => removerItem(i)}
              style={{ marginLeft: 8 }}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      <p>
        <strong>Subtotal: R$ {subtotal.toFixed(2)}</strong>
      </p>

      <Link to="/checkout">
        <button>Ir para o checkout</button>
      </Link>
    </div>
  );
}