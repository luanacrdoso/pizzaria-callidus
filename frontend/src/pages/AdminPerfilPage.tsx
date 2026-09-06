import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarPerfil, atualizarPerfil, trocarSenha } from '../api/auth';

export function AdminPerfilPage() {
  const { data: perfil, isLoading } = useQuery({ queryKey: ['perfil'], queryFn: buscarPerfil });

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtualPerfil, setSenhaAtualPerfil] = useState('');
  const [msgPerfil, setMsgPerfil] = useState('');
  const [erroPerfil, setErroPerfil] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [msgSenha, setMsgSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  useEffect(() => {
    if (perfil) {
      setUsername(perfil.username);
      setEmail(perfil.email ?? '');
    }
  }, [perfil]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroPerfil('');
    setMsgPerfil('');
    try {
      await atualizarPerfil({ username, email, senha_atual: senhaAtualPerfil });
      setMsgPerfil('Dados atualizados com sucesso.');
      setSenhaAtualPerfil('');
    } catch (erro: any) {
      setErroPerfil(erro.message);
    }
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha('');
    setMsgSenha('');
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem.');
      return;
    }
    try {
      await trocarSenha({ senha_atual: senhaAtual, nova_senha: novaSenha });
      setMsgSenha('Senha trocada com sucesso.');
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
    } catch (erro: any) {
      setErroSenha(erro.message);
    }
  };

  if (isLoading) return <p style={{ padding: 24 }}>Carregando...</p>;

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>Meus Dados de Acesso</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Usuário e e-mail</h2>
        <form onSubmit={handleSalvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Usuário
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>E-mail (usado para recuperação de senha)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>Confirme com sua senha atual
            <input type="password" value={senhaAtualPerfil} onChange={(e) => setSenhaAtualPerfil(e.target.value)} required />
          </label>
          {erroPerfil && <p style={{ color: 'red' }}>{erroPerfil}</p>}
          {msgPerfil && <p style={{ color: 'green' }}>{msgPerfil}</p>}
          <button type="submit">Salvar</button>
        </form>
      </section>

      <section>
        <h2>Trocar senha</h2>
        <form onSubmit={handleTrocarSenha} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Senha atual
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
          </label>
          <label>Nova senha
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required minLength={6} />
          </label>
          <label>Confirmar nova senha
            <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required minLength={6} />
          </label>
          {erroSenha && <p style={{ color: 'red' }}>{erroSenha}</p>}
          {msgSenha && <p style={{ color: 'green' }}>{msgSenha}</p>}
          <button type="submit">Trocar Senha</button>
        </form>
      </section>
    </div>
  );
}