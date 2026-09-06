CREATE TABLE IF NOT EXISTS cupons (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('percentual', 'valor_fixo', 'entrega_gratis')),
  valor NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  validade_inicio DATE,
  validade_fim DATE,
  limite_usos INTEGER,
  usos_atuais INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- O pedido registra se um cupom foi usado e quanto de desconto deu
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_codigo VARCHAR(30);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0;