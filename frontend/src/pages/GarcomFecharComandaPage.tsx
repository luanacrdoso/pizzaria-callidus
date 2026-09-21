import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { registrarPagamento } from '../api/comandas';
import { fetchComoFuncionario } from '../api/funcionarioAuth';

const API_URL = import.meta.env.VITE_API_URL;

export function GarcomFecharComandaPage() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: async () => (await fetch(`${API_URL}/pedidos/${pedidoId}`)).json()
  });

  const [incluirGorjeta, setIncluirGorjeta] = useState(false);
  const [nomePagador, setNomePagador] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [erro, setErro] = useState("");

  if (isLoading || !pedido) return <p style={{ padding: 24 }}>Carregando dados da comanda...</p>;

  const subtotal = Number(pedido.subtotal ?? 0);
  const gorjeta = incluirGorjeta ? Number((subtotal * 0.10).toFixed(2)) : 0;
  const totalComGorjeta = subtotal + gorjeta;

  const handleConfirmar = async () => {
    try {
      setErro("");
      await registrarPagamento(Number(pedidoId), {
        nome_pagador: nomePagador || pedido.comanda_nome || "Cliente",
        valor_pago: totalComGorjeta,
        forma_pagamento: formaPagamento
      });

      const resposta = await fetchComoFuncionario(`${API_URL}/pedidos/${pedidoId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finalizado" })
      });

      if (!resposta.ok) {
        const err = await resposta.json();
        setErro(err.mensagem || "Erro ao finalizar pedido.");
        return;
      }

      navigate("/equipe/garcom/comandas");
    } catch (e: any) {
      setErro(e.message || "Erro ao processar pagamento.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <h1>Fechar Comanda — {pedido.comanda_nome || `Mesa ${pedido.mesa_id}`}</h1>
      
      <div className="card-simples" style={{ padding: 16, marginBottom: 16 }}>
        <h3>Itens Consumidos</h3>
        <ul style={{ listStyle: "none", paddingLeft: 0, margin: "12px 0" }}>
          {(pedido.itens ?? []).filter((i: any) => i.status === "ativo").map((i: any) => (
            <li key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>{i.quantidade}x {i.nome} {i.tamanho !== "-" && `(${i.tamanho})`}</span>
              <strong>R\$ {(Number(i.preco_unitario) * i.quantidade).toFixed(2)}</strong>
            </li>
          ))}
        </ul>
        <hr style={{ margin: "12px 0" }} />
        <p>Subtotal: <strong>R\$ {subtotal.toFixed(2)}</strong></p>
        
        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={incluirGorjeta} 
            onChange={(e) => setIncluirGorjeta(e.target.checked)} 
          /> 
          Incluir 10% de gorjeta do garçom (+R\$ {(subtotal * 0.1).toFixed(2)})
        </label>

        <p style={{ fontSize: "1.2rem", color: "var(--gold-dark)" }}>
          <strong>Total a Pagar: R\$ {totalComGorjeta.toFixed(2)}</strong>
        </p>
      </div>

      <div className="card-simples" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <h3>Dados do Pagamento</h3>
        <div>
          <label className="campo-label">Nome de quem está pagando:</label>
          <input 
            style={{ width: "100%" }}
            placeholder="Ex: João Silva" 
            value={nomePagador} 
            onChange={(e) => setNomePagador(e.target.value)} 
          />
        </div>
        <div>
          <label className="campo-label">Forma de Pagamento:</label>
          <select 
            style={{ width: "100%" }}
            value={formaPagamento} 
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Pix">Pix</option>
          </select>
        </div>

        {erro && <div className="mensagem-erro-box">{erro}</div>}

        <button onClick={handleConfirmar} style={{ background: "var(--success)", marginTop: 8 }}>
          ✓ Confirmar Pagamento e Finalizar
        </button>
      </div>
    </div>
  );
}
