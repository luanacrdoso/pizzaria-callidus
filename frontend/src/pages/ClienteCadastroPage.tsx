import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cadastrarCliente } from '../api/clienteAuth';

export function ClienteCadastroPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    senha: '',
    nome: '',
    telefone: '',
    email: ''
  });

  const [erro, setErro] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      await cadastrarCliente(form);
      navigate('/login');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao cadastrar.');
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "40px auto", padding: 16 }}>
      <h1>Criar conta</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        <input
          placeholder="Nome completo"
          value={form.nome}
          onChange={(e) =>
            setForm({ ...form, nome: e.target.value })
          }
          required
        />

        <input
          placeholder="Usuário"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          required
        />

        <input
          placeholder="E-mail"
          type="email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          placeholder="Telefone"
          value={form.telefone}
          onChange={(e) =>
            setForm({ ...form, telefone: e.target.value })
          }
        />

        <input
          placeholder="Senha"
          type="password"
          value={form.senha}
          onChange={(e) =>
            setForm({ ...form, senha: e.target.value })
          }
          required
        />

        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <button type="submit">
          Criar conta
        </button>
      </form>

      <p>
        <Link to="/login">Já tenho conta</Link>
      </p>
    </div>
  );
}