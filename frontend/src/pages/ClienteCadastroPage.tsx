import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarEnderecoPorCep } from '../api/cep';

const API_URL = import.meta.env.VITE_API_URL;

export function ClienteCadastroPage() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleBuscarCep = async (valorCep: string) => {
    setCep(valorCep);

    const cepLimpo = valorCep.replace(/\D/g, "");

    if (cepLimpo.length === 8) {
      const dados = await buscarEnderecoPorCep(cepLimpo);

      if (dados) {
        setEndereco(dados.logradouro || "");
        setBairro(dados.bairro || "");
        setCidade(dados.localidade || "");
        setEstado(dados.uf || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome,
          telefone,
          cpf: cpf || null,
          username,
          senha,
          cep,
          endereco,
          numero,
          bairro,
          cidade,
          estado
        }),
      });

      if (!resposta.ok) {
        const err = await resposta.json();
        setErro(err.mensagem || "Erro ao cadastrar cliente.");
        return;
      }

      navigate("/login");
    } catch (err: any) {
      setErro(err.message || "Erro na conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h1>Criar Conta de Cliente</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        <input
          placeholder="Nome completo *"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <input
          placeholder="Usuário *"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <input
          placeholder="CPF (opcional)"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha *"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirme a senha *"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />

        <h3>Endereço</h3>

        <input
          placeholder="CEP"
          value={cep}
          onChange={(e) => handleBuscarCep(e.target.value)}
          maxLength={9}
        />

        <input
          placeholder="Rua / Endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        <input
          placeholder="Número"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />

        <input
          placeholder="Bairro"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            style={{ flex: 1 }}
          />

          <input
            placeholder="UF"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={{ width: 60 }}
            maxLength={2}
          />
        </div>

        {erro && (
          <p style={{ color: "red", marginTop: 4 }}>
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          style={{ marginTop: 10 }}
        >
          {carregando ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}