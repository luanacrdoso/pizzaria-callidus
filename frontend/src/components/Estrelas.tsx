export function Estrelas({ valor, tamanho = 24, onSelecionar }: { valor: number; tamanho?: number; onSelecionar?: (n: number) => void }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onSelecionar?.(n)}
          style={{
            fontSize: tamanho,
            cursor: onSelecionar ? 'pointer' : 'default',
            color: n <= valor ? '#f5a623' : '#ddd',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}