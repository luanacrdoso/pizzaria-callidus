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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
      <div className="card-central" style={{ width: '100%', maxWidth: '420px' }}>
        <h1 className="text-center">Acessar Conta</h1>

        <div className="filtros-cardapio" style={{ justifyContent: 'center', marginBottom: '20px' }}>
          <button 
            type="button" 
            onClick={() => setTipo('cliente')} 
            className={`categoria-pill ${tipo === 'cliente' ? 'ativa' : ''}`}
          >
            Cliente
          </button>
          <button 
            type="button" 
            onClick={() => setTipo('equipe')} 
            className={`categoria-pill ${tipo === 'equipe' ? 'ativa' : ''}`}
          >
            Equipe
          </button>
          <button 
            type="button" 
            onClick={() => setTipo('admin')} 
            className={`categoria-pill ${tipo === 'admin' ? 'ativa' : ''}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Usuário / E-mail</label>
            <input 
              style={{ width: '100%' }}
              placeholder="Digite seu usuário" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Senha</label>
            <input 
              type="password" 
              style={{ width: '100%' }}
              placeholder="Digite sua senha" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          {erro && <div className="mensagem-erro-box" style={{ margin: '10px 0', padding: '10px' }}>{erro}</div>}

          <button type="submit" disabled={carregando} style={{ width: '100%', marginTop: '10px' }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '20px' }}>
          {tipo === 'cliente' && <p><Link to="/cadastro" className="subtext">Ainda não tem conta? <strong>Criar conta</strong></Link></p>}
          {tipo === 'equipe' && <p><Link to="/equipe/cadastro" className="subtext"><strong>Criar cadastro da equipe</strong></Link></p>}
          <p><Link to="/esqueci-senha" className="subtext">Esqueci minha senha</Link></p>
        </div>
      </div>
    </div>
  );
}