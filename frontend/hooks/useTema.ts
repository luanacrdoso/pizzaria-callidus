import { useEffect, useState } from 'react';

export type ModoTema = "claro" | "escuro";

interface ConfigTema {
  cor_fundo_clara?: string;
  cor_fundo_escura?: string;
  cor_botao_clara?: string;
  cor_botao_escura?: string;
  cor_texto_clara?: string;
  cor_texto_escura?: string;
}

export function useTema(config: ConfigTema | null | undefined) {
  const [modo, setModo] = useState<ModoTema>(() => {
    const salvo = localStorage.getItem("modo-tema");

    if (salvo === "claro" || salvo === "escuro") return salvo;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "escuro"
      : "claro";
  });

  useEffect(() => {
    localStorage.setItem("modo-tema", modo);
    document.documentElement.classList.toggle("dark", modo === "escuro");
  }, [modo]);

  const sufixo = modo === "escuro" ? "escura" : "clara";

  useEffect(() => {
    if (!config) return;

    const corFundo = config[`cor_fundo_${sufixo}`];
    const corBotao = config[`cor_botao_${sufixo}`];
    const corTexto = config[`cor_texto_${sufixo}`];

    if (corFundo) {
      document.documentElement.style.setProperty("--cor-fundo", corFundo);
    }

    if (corBotao) {
      document.documentElement.style.setProperty("--cor-botao", corBotao);
    }

    if (corTexto) {
      document.documentElement.style.setProperty("--cor-texto", corTexto);
    }
  }, [config, sufixo]);

  return { modo, setModo };
}