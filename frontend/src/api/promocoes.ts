import { fetchAutenticado } from './auth';
const API_URL = import.meta.env.VITE_API_URL;
export async function buscarPromocoes() { const r = await fetch(`${API_URL}/promocoes`); return r.json(); }
export async function criarPromocao(dados: any) {
  const r = await fetchAutenticado(`${API_URL}/promocoes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); } return r.json();
}
export async function editarPromocao(promo: any) {
  const r = await fetchAutenticado(`${API_URL}/promocoes/${promo.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(promo) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); } return r.json();
}
export async function excluirPromocao(id: number) {
  const r = await fetchAutenticado(`${API_URL}/promocoes/${id}`, { method: "DELETE" });
  if (!r.ok) { const e = await r.json(); throw new Error(e.mensagem); }
}
