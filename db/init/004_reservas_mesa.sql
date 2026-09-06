CREATE TABLE IF NOT EXISTS reservas_mesa (
  id SERIAL PRIMARY KEY,
  nome_cliente VARCHAR(120) NOT NULL,
  telefone_cliente VARCHAR(20),
  data_reserva DATE NOT NULL,
  horario_reserva VARCHAR(30),
  quantidade_pessoas INTEGER,
  mesa_id INTEGER REFERENCES mesas(id),
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'cancelada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);