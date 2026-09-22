CREATE TABLE promocoes (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('combo', 'desconto_produto')),
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
 
  -- usado quando tipo = combo:
  preco_combo NUMERIC(10,2),
 
  -- usado quando tipo = desconto_produto:
  pizza_id INTEGER REFERENCES pizzas(id) ON DELETE CASCADE,
  desconto_tipo VARCHAR(20) CHECK (desconto_tipo IN ('percentual', 'valor_fixo')),
  desconto_valor NUMERIC(10,2),
 
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
 
CREATE TABLE promocao_combo_slots (
  id SERIAL PRIMARY KEY,
  promocao_id INTEGER NOT NULL REFERENCES promocoes(id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  rotulo VARCHAR(120)
);
