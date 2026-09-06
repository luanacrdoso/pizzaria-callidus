import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { esqueciSenha, redefinirSenha } from '../api/auth';

export function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<'pedir' | 'redefinir'>('pedir');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handlePedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    await esqueciSenha(email);
    setCarregando(false);
    setMensagem('Se esse e-mail estiver cadastrado, um código foi enviado.');
    setEtapa('redefinir');
  };

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await redefinirSenha({ email, codigo, nova_senha: novaSenha });
      navigate('/login');
    } catch (erro: any) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 300 }}>
        <h1>Recuperar senha</h1>

        {etapa === 'pedir' && (
          <form onSubmit={handlePedirCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" required />
            <button type="submit" disabled={carregando}>{carregando ? 'Enviando...' : 'Enviar código'}</button>
          </form>
        )}

        {etapa === 'redefinir' && (
          <form onSubmit={handleRedefinir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'green' }}>{mensagem}</p>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de 6 dígitos" required maxLength={6} />
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha" required minLength={6} />
            {erro && <p style={{ color: 'red' }}>{erro}</p>}
            <button type="submit" disabled={carregando}>{carregando ? 'Salvando...' : 'Redefinir senha'}</button>
          </form>
        )}

        <p style={{ marginTop: 16 }}><Link to="/login">Voltar ao login</Link></p>
      </div>
    </div>
  );
}