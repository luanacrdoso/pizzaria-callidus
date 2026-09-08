import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cadastrarFuncionario } from '../api/funcionarioAuth';

const CARGOS = [
  { valor: 'balcao', rotulo: 'Balcão' },
  { valor: 'cozinha', rotulo: 'Cozinha' },
  { valor: 'garcom', rotulo: 'Garçom' },
  { valor: 'motoboy', rotulo: 'Motoboy' },
];

export function FuncionarioCadastroPage() {
  const [form, setForm] = useState({ username: '', senha: '', nome: '', telefone: '', cargo: 'balcao' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const campo = (chave: keyof typeof form) => ({
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [chave]: e.target.value })
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await cadastrarFuncionario(form);
      setSucesso(true);
    } catch (err: any) {
      setErro(err.message);
    }
  };

  if (sucesso) {
    return (
      <div style={{ maxWidth: 320, margin: '40px auto', padding: 16 }}>
        <h1>Cadastro enviado!</h1>
        <p>Aguarde o Admin aprovar seu acesso antes de fazer login.</p>
        <Link to="/equipe/login">Ir para o login</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 320, margin: "40px auto", padding: 16 }}>
      <h1>Cadastro da Equipe</h1>
      <p style={{ fontSize: 12, color: '#888' }}>Tela provisória — vai ser unificada com o cadastro de Cliente depois.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="Nome completo" {...campo('nome')} required />
        <input placeholder="Telefone" {...campo('telefone')} />
        <select value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}>
          {CARGOS.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
        </select>
        <input placeholder="Usuário" {...campo('username')} required />
        <input placeholder="Senha" type="password" {...campo('senha')} required />
        {erro && <p style={{ color: "red" }}>{erro}</p>}
        <button type="submit">Criar cadastro</button>
      </form>
      <p><Link to="/equipe/login">Já tenho conta</Link></p>
    </div>
  );
}