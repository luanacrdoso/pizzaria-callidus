import { useEffect, useState } from 'react';

export type ModoTema = "claro" | "escuro";

export function useTema(config: any) {
  const [modo, setModo] = useState<ModoTema>(() => {
    const salvo = localStorage.getItem("modo-tema");
    if (salvo === "claro" || salvo === "escuro") return salvo;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  });

  useEffect(() => {
    localStorage.setItem("modo-tema", modo);
    document.documentElement.classList.toggle("dark", modo === "escuro");
  }, [modo]);

  const sufixo = modo === "escuro" ? "escura" : "clara";

  useEffect(() => {
    if (!config) return;
    document.documentElement.style.setProperty("--cor-fundo", config[`cor_fundo_${sufixo}`]);
    document.documentElement.style.setProperty("--cor-botao", config[`cor_botao_${sufixo}`]);
    document.documentElement.style.setProperty("--cor-texto", config[`cor_texto_${sufixo}`]);
  }, [config, sufixo]);

  return { modo, setModo };
}