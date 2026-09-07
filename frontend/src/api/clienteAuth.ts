const API_URL = import.meta.env.VITE_API_URL;

interface DadosCadastroCliente {
  username: string;
  senha: string;
  nome: string;
  telefone?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

interface RespostaLogin {
  token: string;
}

interface RespostaErro {
  mensagem?: string;
}

export async function cadastrarCliente(dados: DadosCadastroCliente) {
  const resposta = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });

  if (!resposta.ok) {
    const erro: RespostaErro = await resposta.json();
    throw new Error(erro.mensagem || 'Erro ao cadastrar.');
  }

  return resposta.json();
}

export async function loginCliente(
  username: string,
  password: string
): Promise<string> {
  const resposta = await fetch(`${API_URL}/auth/cliente/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password
    })
  });

  if (!resposta.ok) {
    throw new Error('Usuário ou senha inválidos.');
  }

  const dados: RespostaLogin = await resposta.json();

  return dados.token;
}

export function salvarTokenCliente(token: string) {
  localStorage.setItem('cliente_token', token);
}

export function obterTokenCliente(): string | null {
  return localStorage.getItem('cliente_token');
}

export function logoutCliente() {
  localStorage.removeItem('cliente_token');
}

export async function fetchComoCliente(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = obterTokenCliente();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}