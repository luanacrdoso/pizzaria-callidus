import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login as loginAdmin, salvarToken as salvarTokenAdmin } from '../api/auth';
import { loginCliente, salvarTokenCliente } from '../api/clienteAuth';
import { loginFuncionario, salvarSessaoFuncionario, salvarUsernameFuncionario } from '../api/funcionarioAuth';

type TipoLogin = 'cliente' | 'equipe' | 'admin';

export function LoginPage({ default: tipoInicial = 'cliente' }: { default?: TipoLogin }) {
  const [tipo, setTipo] = useState<TipoLogin>(tipoInicial);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (tipo === 'cliente') {
        const token = await loginCliente(username, password);
        salvarTokenCliente(token);
        window.location.href = '/';
      } else if (tipo === 'equipe') {
        const { token, cargo, nome } = await loginFuncionario(username, password);
        salvarSessaoFuncionario(token, cargo, nome);
        salvarUsernameFuncionario(username);
        window.location.href = '/equipe';
      } else {
        const token = await loginAdmin(username, password);
        salvarTokenAdmin(token);
        window.location.href = '/admin';
      }
    } catch (err: any) {
      setErro(err.message || 'Usuário ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 320 }}>
        <h1>Entrar</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" onClick={() => setTipo('cliente')} disabled={tipo === 'cliente'}>Cliente</button>
          <button type="button" onClick={() => setTipo('equipe')} disabled={tipo === 'equipe'}>Equipe</button>
          <button type="button" onClick={() => setTipo('admin')} disabled={tipo === 'admin'}>Admin</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {erro && <p style={{ color: 'red' }}>{erro}</p>}
          <button type="submit" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
        </form>

        {tipo === 'cliente' && <p style={{ marginTop: 12 }}><Link to="/cadastro">Criar conta</Link></p>}
        {tipo === 'equipe' && <p style={{ marginTop: 12 }}><Link to="/equipe/cadastro">Criar cadastro da equipe</Link></p>}
        <p><Link to="/esqueci-senha">Esqueci minha senha</Link></p>
      </div>
    </div>
  );
}