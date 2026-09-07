import { fetchAutenticado } from './auth';

export interface Categoria { id: number; nome: string; ativa: boolean; }

const API_URL = import.meta.env.VITE_API_URL;

export async function buscarCategorias(): Promise<Categoria[]> {
  const r = await fetch(`${API_URL}/categorias`);
  if (!r.ok) throw new Error('Erro ao buscar categorias.');
  return r.json();
}

export async function criarCategoria(nome: string): Promise<Categoria> {
  const r = await fetchAutenticado(`${API_URL}/categorias`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome })
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); }
  return r.json();
}

export async function excluirCategoria(id: number): Promise<void> {
  const r = await fetchAutenticado(`${API_URL}/categorias/${id}`, { method: 'DELETE' });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); }
}