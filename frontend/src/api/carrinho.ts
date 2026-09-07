import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface ItemCarrinho {
 pizzaId: number;
 nome: string;
 tamanho: string;
 extras: string[];
 observacoes: string;
 quantidade: number;
 precoUnitario: number;
}
interface CarrinhoState {
 itens: ItemCarrinho[];
 adicionarItem: (item: ItemCarrinho) => void;
 removerItem: (index: number) => void;
 alterarQuantidade: (index: number, quantidade: number) => void;
 limparCarrinho: () => void;
}
export const useCarrinhoStore = create<CarrinhoState>()(
 persist(
 (set) => ({
 itens: [],
 adicionarItem: (item) => set((state) => ({ itens: [...state.itens, item] })),
 removerItem: (index) => set((state) => ({ itens: state.itens.filter((_, i) => i !== index)
})),
 alterarQuantidade: (index, quantidade) => set((state) => ({
 itens: state.itens.map((it, i) => i === index ? { ...it, quantidade } : it)
 })),
 limparCarrinho: () => set({ itens: [] }),
 }),
 { name: 'carrinho-pizzaria' }
 )
);
