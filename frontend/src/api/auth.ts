const API_URL = import.meta.env.VITE_API_URL;

export async function login(username: string, password: string): Promise<string> {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!resposta.ok) throw new Error('Usuário ou senha inválidos.');
  const dados = await resposta.json();
  return dados.token;
}

export function salvarToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function obterToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function logout() {
  localStorage.removeItem('admin_token');
}

export async function fetchAutenticado(url: string, options: RequestInit = {}): Promise<Response> {
  const token = obterToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

export interface Perfil {
  id: number;
  username: string;
  email: string | null;
}

export async function buscarPerfil(): Promise<Perfil> {
  const resposta = await fetchAutenticado(`${API_URL}/me`);
  if (!resposta.ok) throw new Error('Erro ao buscar perfil.');
  return resposta.json();
}

export async function atualizarPerfil(dados: { username: string; email: string; senha_atual: string }): Promise<Perfil> {
  const resposta = await fetchAutenticado(`${API_URL}/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao atualizar perfil.');
  }
  return resposta.json();
}

export async function trocarSenha(dados: { senha_atual: string; nova_senha: string }): Promise<void> {
  const resposta = await fetchAutenticado(`${API_URL}/me/senha`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao trocar senha.');
  }
}

export async function esqueciSenha(email: string): Promise<void> {
  await fetch(`${API_URL}/auth/esqueci-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function redefinirSenha(dados: { email: string; codigo: string; nova_senha: string }): Promise<void> {
  const resposta = await fetch(`${API_URL}/auth/redefinir-senha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao redefinir senha.');
  }
}