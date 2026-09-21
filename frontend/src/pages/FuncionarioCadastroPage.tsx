import { useState } from 'react';
import { cadastrarFuncionario } from '../api/funcionarioAuth';

export function FuncionarioCadastroPage() {
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("balcao");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso(false);

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
      await cadastrarFuncionario({
        nome,
        username,
        telefone,
        email,
        cargo,
        senha
      });
      setSucesso(true);
      setNome("");
      setUsername("");
      setTelefone("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      setErro(err.message || "Erro ao solicitar cadastro.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "0 auto", padding: 24 }}>
      <h1>Cadastro da Equipe</h1>
      <p className="subtext" style={{ marginBottom: 16 }}>
        Preencha os dados abaixo. Seu cadastro precisará ser aprovado pelo Administrador.
      </p>

      {sucesso ? (
        <div className="mensagem-sucesso-box" style={{ padding: 16 }}>
          <h3>Cadastro enviado com sucesso! 🎉</h3>
          <p>Aguarde o Administrador aprovar seu acesso para poder fazer login.</p>
          <a href="/equipe/login" style={{ display: "inline-block", marginTop: 12 }}>Voltar para o Login</a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Nome completo *" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input placeholder="Nome de usuário (username) *" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="campo-label">Cargo / Função:</label>
          <select value={cargo} onChange={(e) => setCargo(e.target.value)} required>
            <option value="balcao">Balcão</option>
            <option value="cozinha">Cozinha</option>
            <option value="garcom">Garçom</option>
            <option value="motoboy">Motoboy</option>
          </select>

          <input
            type="password"
            placeholder="Senha (mínimo 6 caracteres) *"
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

          {erro && <p style={{ color: "red", marginTop: 4 }}>{erro}</p>}

          <button type="submit" disabled={carregando} style={{ marginTop: 10 }}>
            {carregando ? "Enviando..." : "Solicitar Cadastro"}
          </button>
        </form>
      )}
    </div>
  );
}
