import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginCliente, salvarTokenCliente } from '../api/clienteAuth';
export function ClienteLoginPage() {
 const navigate = useNavigate();
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [erro, setErro] = useState('') 
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErro('');
 try {
 const token = await loginCliente(username, password);
 salvarTokenCliente(token);
 navigate('/');
 } catch {
 setErro('Usuário ou senha inválidos.');
 }
 };
 return (
 <div style={{ maxWidth: 320, margin: "40px auto", padding: 16 }}>
 <h1>Entrar</h1>
 <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8
}}>
 <input placeholder="Usuário" value={username} onChange={(e) =>
setUsername(e.target.value)} />
 <input placeholder="Senha" type="password" value={password} onChange={(e) =>
setPassword(e.target.value)} />
 {erro && <p style={{ color: "red" }}>{erro}</p>}
 <button type="submit">Entrar</button>
 </form>
 <p><Link to="/cadastro">Criar conta</Link> · <Link to="/esqueci-senha">Esqueci minha
senha</Link></p>
 <p><Link to="/">Continuar sem login</Link></p>
 </div>
 );
}
