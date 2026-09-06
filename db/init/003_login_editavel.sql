CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  username VARCHAR(50) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  email VARCHAR(120)
);

-- Semente inicial: usuário "admin", senha "admin123" (dá pra trocar depois pela própria tela)
INSERT INTO admins (id, username, senha_hash, email)
VALUES (1, 'admin', crypt('admin123', gen_salt('bf')), NULL)
ON CONFLICT (id) DO NOTHING;

-- Funcionários também precisam de e-mail, pra recuperação de senha
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS email VARCHAR(120);

-- Códigos de recuperação de senha (válidos por 15 minutos, uso único)
CREATE TABLE IF NOT EXISTS codigos_recuperacao (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);