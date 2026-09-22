import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Estrelas } from './Estrelas';

describe('Estrelas', () => {
  it('renderiza 5 estrelas', () => {
    render(<Estrelas valor={3} />);
    expect(screen.getAllByText('★')).toHaveLength(5);
  });

  it('chama onSelecionar com o número clicado', () => {
    const aoSelecionar = vi.fn();
    render(<Estrelas valor={0} onSelecionar={aoSelecionar} />);
    fireEvent.click(screen.getAllByText('★')[3]);
    expect(aoSelecionar).toHaveBeenCalledWith(4);
  });
});