import { useRef } from 'react';
export function Carrossel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rolar = (direcao: number) => {
    ref.current?.scrollBy({ left: direcao * 320, behavior: "smooth" });
  };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => rolar(-1)} className="carrossel-seta carrossel-seta-esq">‹</button>
      <div ref={ref} className="carrossel-trilho">{children}</div>
      <button onClick={() => rolar(1)} className="carrossel-seta carrossel-seta-dir">›</button>
    </div>
  );
}
