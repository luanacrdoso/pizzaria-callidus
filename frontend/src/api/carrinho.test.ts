import { describe, it, expect, beforeEach } from 'vitest';
import { useCarrinhoStore } from './carrinho';

const itemExemplo = {
  pizzaId: 1, nome: 'Calabresa', tamanho: 'grande',
  extras: [], observacoes: '', quantidade: 1, precoUnitario: 50,
};

describe('useCarrinhoStore', () => {
  beforeEach(() => { useCarrinhoStore.getState().limparCarrinho(); });

  it('começa vazio', () => {
    expect(useCarrinhoStore.getState().itens).toHaveLength(0);
  });

  it('adiciona um item', () => {
    useCarrinhoStore.getState().adicionarItem(itemExemplo);
    expect(useCarrinhoStore.getState().itens).toHaveLength(1);
  });

  it('altera a quantidade de um item', () => {
    useCarrinhoStore.getState().adicionarItem(itemExemplo);
    useCarrinhoStore.getState().alterarQuantidade(0, 3);
    expect(useCarrinhoStore.getState().itens[0].quantidade).toBe(3);
  });

  it('remove um item', () => {
    useCarrinhoStore.getState().adicionarItem(itemExemplo);
    useCarrinhoStore.getState().removerItem(0);
    expect(useCarrinhoStore.getState().itens).toHaveLength(0);
  });
});