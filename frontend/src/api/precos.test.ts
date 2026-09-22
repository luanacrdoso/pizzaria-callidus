import { describe, it, expect } from 'vitest';
import { calcularPrecoPizzaMultiplosSabores } from './precos';

describe('calcularPrecoPizzaMultiplosSabores', () => {
  it('retorna 0 para lista vazia', () => {
    expect(calcularPrecoPizzaMultiplosSabores([])).toBe(0);
  });

  it('com um único sabor, retorna o preço integral dele', () => {
    expect(calcularPrecoPizzaMultiplosSabores([50])).toBe(50);
  });

  it('divide igualmente entre 2 sabores', () => {
    // Grande Calabresa R$50 + Grande Muçarela R$40 -> 50/2 + 40/2 = 45
    expect(calcularPrecoPizzaMultiplosSabores([50, 40])).toBe(45);
  });

  it('divide igualmente entre 3 sabores', () => {
    expect(calcularPrecoPizzaMultiplosSabores([60, 60, 30])).toBeCloseTo(50, 2);
  });
});