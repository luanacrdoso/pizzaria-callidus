import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchComoCliente } from '../api/clienteAuth';
import { buscarEnderecoPorCep } from '../api/cep';

const API_URL = import.meta.env.VITE_API_URL;

async function buscarPerfilCliente() {
  const r = await fetchComoCliente(`${API_URL}/clientes/meu-perfil`);
  if (!r.ok) throw new Error('Erro ao buscar perfil.');
  return r.json();
}

export function ClientePerfilPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['meu-perfil'], queryFn: buscarPerfilCliente });
  const [form, setForm] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [msgSenha, setMsgSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  useEffect(() => { if (data) setForm(data); }, [data]);

  if (isLoading || !form) return <p style={{ padding: 24 }}>Carregando perfil...</p>;

  const campo = (chave: string) => ({
    value: form[chave] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [chave]: e.target.value })
  });

  const handleBuscarCep = async () => {
    setBuscandoCep(true);
    const endereco = await buscarEnderecoPorCep(form.cep);
    setBuscandoCep(false);
    if (!endereco) return;
    setForm((f: any) => ({
      ...f,
      endereco: endereco.logradouro || f.endereco,
      bairro: endereco.bairro || f.bairro,
      cidade: endereco.localidade || f.cidade,
      estado: endereco.uf || f.estado,
    }));
  };

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setMsg('');
    const r = await fetchComoCliente(`${API_URL}/clientes/meu-perfil`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    });
    if (!r.ok) { setErro('Erro ao salvar.'); return; }
    setMsg('Dados atualizados com sucesso.');
    queryClient.invalidateQueries({ queryKey: ['meu-perfil'] });
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(''); setMsgSenha('');
    const r = await fetchComoCliente(`${API_URL}/me/senha`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha })
    });
    if (!r.ok) { const err = await r.json(); setErroSenha(err.mensagem); return; }
    setMsgSenha('Senha atualizada com sucesso.');
    setSenhaAtual(''); setNovaSenha('');
  };

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>Meu Perfil</h1>

      <form onSubmit={handleSalvarDados} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        <h2>Dados pessoais e endereço</h2>
        <input placeholder="Nome" {...campo('nome')} />
        <input placeholder="Telefone" {...campo('telefone')} />
        <input placeholder="CPF" {...campo('cpf')} />
        <input placeholder="CEP" {...campo('cep')} onBlur={handleBuscarCep} maxLength={9} />
        {buscandoCep && <p style={{ fontSize: 12, color: '#888' }}>Buscando endereço...</p>}
        <input placeholder="Endereço" {...campo('endereco')} />
        <input placeholder="Número" {...campo('numero')} />
        <input placeholder="Bairro" {...campo('bairro')} />
        <input placeholder="Cidade" {...campo('cidade')} />
        <input placeholder="Estado (UF)" maxLength={2} {...campo('estado')} />
        {erro && <p style={{ color: 'red' }}>{erro}</p>}
        {msg && <p style={{ color: 'green' }}>{msg}</p>}
        <button type="submit">Salvar</button>
      </form>

      <form onSubmit={handleTrocarSenha} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>Trocar senha</h2>
        <input type="password" placeholder="Senha atual" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
        <input type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required minLength={6} />
        {erroSenha && <p style={{ color: 'red' }}>{erroSenha}</p>}
        {msgSenha && <p style={{ color: 'green' }}>{msgSenha}</p>}
        <button type="submit">Trocar Senha</button>
      </form>
    </div>
  );
}