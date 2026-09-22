CREATE TABLE vitrine_secoes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true
);
 
CREATE TABLE vitrine_itens (
  id SERIAL PRIMARY KEY,
  secao_id INTEGER NOT NULL REFERENCES vitrine_secoes(id) ON DELETE CASCADE,
  item_tipo VARCHAR(20) NOT NULL CHECK (item_tipo IN ('pizza', 'promocao')),
  item_id INTEGER NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0
);
