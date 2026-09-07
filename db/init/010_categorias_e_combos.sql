CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(60) UNIQUE NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO categorias (nome) VALUES
  ('Pizza Tradicional'), ('Pizza Especial'), ('Pizza Vegetariana'), ('Pizza Doce'), ('Bebida'), ('Combo')
ON CONFLICT (nome) DO NOTHING;

ALTER TABLE pizzas ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES categorias(id);

UPDATE pizzas SET categoria_id = (SELECT id FROM categorias WHERE nome = 'Pizza Tradicional') WHERE categoria = 'tradicional' AND categoria_id IS NULL;
UPDATE pizzas SET categoria_id = (SELECT id FROM categorias WHERE nome = 'Pizza Especial') WHERE categoria = 'especial' AND categoria_id IS NULL;
UPDATE pizzas SET categoria_id = (SELECT id FROM categorias WHERE nome = 'Pizza Vegetariana') WHERE categoria = 'vegetariana' AND categoria_id IS NULL;
UPDATE pizzas SET categoria_id = (SELECT id FROM categorias WHERE nome = 'Pizza Doce') WHERE categoria = 'doce' AND categoria_id IS NULL;
UPDATE pizzas SET categoria_id = (SELECT id FROM categorias WHERE nome = 'Bebida') WHERE categoria = 'bebida' AND categoria_id IS NULL;
UPDATE pizzas SET categoria_id = (SELECT id FROM categorias WHERE nome = 'Combo') WHERE categoria = 'combo' AND categoria_id IS NULL;

ALTER TABLE pizzas DROP CONSTRAINT IF EXISTS pizzas_categoria_check;
ALTER TABLE pizzas ALTER COLUMN categoria DROP NOT NULL;

ALTER TABLE pizzas DROP CONSTRAINT IF EXISTS pizzas_tipo_check;
ALTER TABLE pizzas ADD CONSTRAINT pizzas_tipo_check CHECK (tipo IN ('sabor_unico', 'personalizavel', 'combo'));

ALTER TABLE pizzas ADD COLUMN IF NOT EXISTS preco_combo NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS combo_slots (
  id SERIAL PRIMARY KEY,
  combo_id INTEGER NOT NULL REFERENCES pizzas(id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  rotulo VARCHAR(60)
);