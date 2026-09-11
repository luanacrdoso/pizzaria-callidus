import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cadastrarCliente } from '../api/clienteAuth';

export function ClienteCadastroPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '', senha: '', nome: '', telefone: '', email: '', cpf: '',
    cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: ''
  });

  const [erro, setErro] = useState('');

  const campo = (chave: keyof typeof form) => ({
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [chave]: e.target.value })
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      await cadastrarCliente(form);
      navigate('/login');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar conta.');
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "40px auto", padding: 16 }}>
      <h1>Criar conta</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="Nome completo" {...campo('nome')} required />
        <input placeholder="Usuário" {...campo('username')} required />
        <input placeholder="E-mail" type="email" {...campo('email')} />
        <input placeholder="Telefone" {...campo('telefone')} />
        <input placeholder="CPF" {...campo('cpf')} />
        <input placeholder="Senha" type="password" {...campo('senha')} required />

        <p style={{ marginBottom: 0, fontWeight: "bold" }}>
          Endereço (opcional, facilita nos pedidos)
        </p>

        <input placeholder="CEP" {...campo('cep')} />
        <input placeholder="Endereço" {...campo('endereco')} />
        <input placeholder="Número" {...campo('numero')} />
        <input placeholder="Bairro" {...campo('bairro')} />
        <input placeholder="Cidade" {...campo('cidade')} />
        <input placeholder="Estado (UF)" maxLength={2} {...campo('estado')} />

        {erro && <p style={{ color: "red" }}>{erro}</p>}
        <button type="submit">Criar conta</button>
      </form>

      <p><Link to="/login">Já tenho conta</Link></p>
    </div>
  );
}