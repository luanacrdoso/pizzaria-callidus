const API_URL = import.meta.env.VITE_API_URL;

export async function loginFuncionario(
  username: string,
  password: string
): Promise<{ token: string; cargo: string; nome: string }> {

  const resposta = await fetch(`${API_URL}/auth/funcionario/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Usuário ou senha inválidos.');
  }

  return resposta.json();
}

export function salvarSessaoFuncionario(
  token: string,
  cargo: string,
  nome: string
) {
  localStorage.setItem('equipe_token', token);
  localStorage.setItem('equipe_cargo', cargo);
  localStorage.setItem('equipe_nome', nome);
}

export function obterTokenFuncionario(): string | null {
  return localStorage.getItem('equipe_token');
}

export function obterCargoFuncionario(): string | null {
  return localStorage.getItem('equipe_cargo');
}

export function logoutFuncionario() {
  localStorage.removeItem('equipe_token');
  localStorage.removeItem('equipe_cargo');
  localStorage.removeItem('equipe_nome');
}

export async function fetchComoFuncionario(
  url: string,
  options: RequestInit = {}
): Promise<Response> {

  const token = obterTokenFuncionario();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

export async function cadastrarFuncionario(dados: {
  username: string;
  senha: string;
  nome: string;
  telefone: string;
  cargo: string;
}): Promise<unknown> {

  const resposta = await fetch(`${API_URL}/funcionarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao cadastrar.');
  }

  return resposta.json();
}

export function salvarUsernameFuncionario(username: string) {
  localStorage.setItem('equipe_username', username);
}

export function obterUsernameFuncionario(): string | null {
  return localStorage.getItem('equipe_username');
}