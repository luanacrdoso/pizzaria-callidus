import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginFuncionario, salvarSessaoFuncionario, salvarUsernameFuncionario } from '../api/funcionarioAuth';

export function FuncionarioLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      const { token, cargo, nome } = await loginFuncionario(username, password);
      salvarSessaoFuncionario(token, cargo, nome);
      salvarUsernameFuncionario(username);
      window.location.href = '/equipe';
    } catch (err: any) {
      setErro(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: "40px auto", padding: 16 }}>
      <h1>Login da Equipe</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {erro && <p style={{ color: "red" }}>{erro}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p><Link to="/equipe/cadastro">Criar cadastro</Link></p>
      <p><Link to="/equipe/cadastro">Criar cadastro</Link> · <Link to="/esqueci-senha">Esqueci minha senha</Link></p>
    </div>
  );
}