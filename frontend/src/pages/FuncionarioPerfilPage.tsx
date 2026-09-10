import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchComoFuncionario } from '../api/funcionarioAuth';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarPerfil() {
  const r = await fetchComoFuncionario(`${API_URL}/me`);
  if (!r.ok) throw new Error('Erro ao buscar perfil.');
  return r.json();
}

export function FuncionarioPerfilPage() {
  const { data, isLoading } = useQuery({ queryKey: ['meu-perfil-funcionario'], queryFn: buscarPerfil });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtualPerfil, setSenhaAtualPerfil] = useState('');
  const [msgPerfil, setMsgPerfil] = useState('');
  const [erroPerfil, setErroPerfil] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [msgSenha, setMsgSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  useEffect(() => {
    if (data) { setUsername(data.username); setEmail(data.email ?? ''); }
  }, [data]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroPerfil(''); setMsgPerfil('');
    const r = await fetchComoFuncionario(`${API_URL}/me`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, senha_atual: senhaAtualPerfil })
    });
    if (!r.ok) { const err = await r.json(); setErroPerfil(err.mensagem); return; }
    setMsgPerfil('Dados atualizados com sucesso.');
    setSenhaAtualPerfil('');
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(''); setMsgSenha('');
    const r = await fetchComoFuncionario(`${API_URL}/me/senha`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha })
    });
    if (!r.ok) { const err = await r.json(); setErroSenha(err.mensagem); return; }
    setMsgSenha('Senha atualizada com sucesso.');
    setSenhaAtual(''); setNovaSenha('');
  };

  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>Meus Dados de Acesso</h1>

      <form onSubmit={handleSalvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        <h2>Usuário e e-mail</h2>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail (para recuperação de senha)" />
        <input type="password" value={senhaAtualPerfil} onChange={(e) => setSenhaAtualPerfil(e.target.value)} placeholder="Confirme com sua senha atual" required />
        {erroPerfil && <p style={{ color: 'red' }}>{erroPerfil}</p>}
        {msgPerfil && <p style={{ color: 'green' }}>{msgPerfil}</p>}
        <button type="submit">Salvar</button>
      </form>

      <form onSubmit={handleTrocarSenha} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>Trocar senha</h2>
        <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Senha atual" required />
        <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha" required minLength={6} />
        {erroSenha && <p style={{ color: 'red' }}>{erroSenha}</p>}
        {msgSenha && <p style={{ color: 'green' }}>{msgSenha}</p>}
        <button type="submit">Trocar Senha</button>
      </form>
    </div>
  );
}