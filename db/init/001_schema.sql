-- ========== RESTAURANTE (config única da pizzaria) ==========
CREATE TABLE restaurante_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- garante que só existe 1 linha
  nome VARCHAR(120) NOT NULL DEFAULT 'Minha Pizzaria',
  descricao TEXT,
  logo_url TEXT,
  capa_url TEXT,
  cor_primaria_clara VARCHAR(7) NOT NULL DEFAULT '#ef4444',
  cor_secundaria_clara VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
  cor_primaria_escura VARCHAR(7) NOT NULL DEFAULT '#ef4444',
  cor_secundaria_escura VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
  endereco TEXT,
  dias_funcionamento VARCHAR(60),
  horario_funcionamento VARCHAR(60),
  telefone VARCHAR(20),
  tempo_preparo_estimado VARCHAR(30),
  taxa_entrega NUMERIC(10,2) NOT NULL DEFAULT 0,
  chave_pix VARCHAR(120),
  formas_pagamento_aceitas JSONB NOT NULL DEFAULT '["Pix", "Dinheiro"]'
);

INSERT INTO restaurante_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ========== FUNCIONÁRIOS ==========
CREATE TABLE funcionarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(20),
  cargo VARCHAR(20) NOT NULL CHECK (cargo IN ('balcao', 'cozinha', 'garcom', 'motoboy')),
  aprovado BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== MESAS ==========
CREATE TABLE mesas (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  capacidade INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada')),
  garcom_responsavel_username VARCHAR(50) REFERENCES funcionarios(username) ON DELETE SET NULL
);

-- ========== ADICIONAIS ==========
CREATE TABLE adicionais (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  preco NUMERIC(10,2) NOT NULL
);

-- ========== CARDÁPIO (pizzas, bebidas, combos) ==========
CREATE TABLE pizzas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('tradicional', 'especial', 'vegetariana', 'doce', 'bebida', 'combo')),
  imagem_url TEXT,
  preco_brotinho NUMERIC(10,2),
  preco_media NUMERIC(10,2),
  preco_grande NUMERIC(10,2),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sabor_unico', 'personalizavel')),
  max_sabores_brotinho INTEGER,
  max_sabores_media INTEGER,
  max_sabores_grande INTEGER,
  visivel BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quais sabores/itens uma pizza personalizável (ou combo) pode usar
CREATE TABLE pizza_sabores (
  pizza_id INTEGER NOT NULL REFERENCES pizzas(id) ON DELETE CASCADE,
  sabor_id INTEGER NOT NULL REFERENCES pizzas(id) ON DELETE CASCADE,
  PRIMARY KEY (pizza_id, sabor_id)
);

-- ========== SALÃO DE EVENTOS ==========
CREATE TABLE salao_eventos (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- também é config única
  nome VARCHAR(120),
  descricao TEXT,
  capacidade_pessoas INTEGER,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO salao_eventos (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE reservas_salao (
  id SERIAL PRIMARY KEY,
  salao_id INTEGER NOT NULL REFERENCES salao_eventos(id),
  nome_cliente VARCHAR(120) NOT NULL,
  telefone_cliente VARCHAR(20),
  data_evento DATE NOT NULL,
  horario_evento VARCHAR(30),
  quantidade_convidados INTEGER,
  valor_combinado NUMERIC(10,2),
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'cancelada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== PEDIDOS ==========
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrega', 'presencial', 'retirada')),
  cliente_nome VARCHAR(120),
  cliente_telefone VARCHAR(20),
  mesa_id INTEGER REFERENCES mesas(id),
  garcom_username VARCHAR(50) REFERENCES funcionarios(username),
  motoboy_username VARCHAR(50) REFERENCES funcionarios(username),
  subtotal NUMERIC(10,2) NOT NULL,
  taxa_entrega NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'preparo', 'pronto', 'entregue', 'finalizado', 'cancelado')),
  endereco_entrega TEXT,
  cpf_nota VARCHAR(20),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  pizza_id INTEGER REFERENCES pizzas(id) ON DELETE SET NULL,
  nome VARCHAR(150) NOT NULL,       -- snapshot: nome no momento da compra
  tamanho VARCHAR(20) NOT NULL,
  extras JSONB NOT NULL DEFAULT '[]',
  observacoes TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL, -- snapshot: preço no momento da compra
  servido BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE pedido_pagamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  nome_pagador VARCHAR(120) NOT NULL,
  valor_pago NUMERIC(10,2) NOT NULL,
  forma_pagamento VARCHAR(30) NOT NULL
);

-- Índice para acelerar os filtros de período do histórico do Admin
CREATE INDEX idx_pedidos_criado_em ON pedidos (criado_em);