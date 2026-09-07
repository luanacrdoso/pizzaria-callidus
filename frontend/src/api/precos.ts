export function calcularPrecoPizzaMultiplosSabores(precosPorSabor: number[]): number {
  if (precosPorSabor.length === 0) return 0;
  const soma = precosPorSabor.reduce((total, preco) => total + preco / precosPorSabor.length, 0);
  return Number(soma.toFixed(2));
}