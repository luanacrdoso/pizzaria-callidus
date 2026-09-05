import { Router } from 'express';
import { pool } from './db';

export const router = Router();

// GET /api/pizzas — lista todo o cardápio
router.get('/pizzas', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pizzas ORDER BY criado_em DESC');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar cardápio.' });
  }
});

// GET /api/pizzas/:id — busca um item específico
router.get('/pizzas/:id', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pizzas WHERE id = $1', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar item.' });
  }
});

// POST /api/pizzas — cria um novo item do cardápio
router.post('/pizzas', async (req, res) => {
  const {
    nome, descricao, categoria, imagem_url,
    preco_brotinho, preco_media, preco_grande,
    tipo, max_sabores_brotinho, max_sabores_media, max_sabores_grande
  } = req.body;

  if (!nome || !categoria || !tipo) {
    return res.status(400).json({ mensagem: 'nome, categoria e tipo são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO pizzas
        (nome, descricao, categoria, imagem_url, preco_brotinho, preco_media, preco_grande,
         tipo, max_sabores_brotinho, max_sabores_media, max_sabores_grande)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [nome, descricao, categoria, imagem_url, preco_brotinho, preco_media, preco_grande,
       tipo, max_sabores_brotinho, max_sabores_media, max_sabores_grande]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar item do cardápio.' });
  }
});

// PUT /api/pizzas/:id — edita um item existente
router.put('/pizzas/:id', async (req, res) => {
  const {
    nome, descricao, categoria, imagem_url,
    preco_brotinho, preco_media, preco_grande,
    tipo, max_sabores_brotinho, max_sabores_media, max_sabores_grande, visivel
  } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE pizzas SET
        nome = $1, descricao = $2, categoria = $3, imagem_url = $4,
        preco_brotinho = $5, preco_media = $6, preco_grande = $7,
        tipo = $8, max_sabores_brotinho = $9, max_sabores_media = $10,
        max_sabores_grande = $11, visivel = $12
       WHERE id = $13
       RETURNING *`,
      [nome, descricao, categoria, imagem_url, preco_brotinho, preco_media, preco_grande,
       tipo, max_sabores_brotinho, max_sabores_media, max_sabores_grande, visivel, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao editar item.' });
  }
});

// DELETE /api/pizzas/:id
router.delete('/pizzas/:id', async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM pizzas WHERE id = $1 RETURNING id', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao excluir item.' });
  }
});

// GET /api/adicionais — lista os adicionais
router.get('/adicionais', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM adicionais ORDER BY id');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar adicionais.' });
  }
});

// POST /api/adicionais — cria um adicional
router.post('/adicionais', async (req, res) => {
  const { nome, preco } = req.body;

  if (!nome || preco === undefined) {
    return res.status(400).json({ mensagem: 'nome e preco são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO adicionais (nome, preco) VALUES ($1, $2) RETURNING *',
      [nome, preco]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar adicional.' });
  }
});

// DELETE /api/adicionais/:id
router.delete('/adicionais/:id', async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM adicionais WHERE id = $1 RETURNING id', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Adicional não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao excluir adicional.' });
  }
});

// GET /api/config — busca a configuração da pizzaria
router.get('/config', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM restaurante_config WHERE id = 1');
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar configuração.' });
  }
});

// PUT /api/config — atualiza a configuração da pizzaria
router.put('/config', async (req, res) => {
  const {
    nome, descricao, logo_url, capa_url,
    cor_primaria_clara, cor_secundaria_clara,
    cor_primaria_escura, cor_secundaria_escura,
    endereco, dias_funcionamento, horario_funcionamento,
    telefone, tempo_preparo_estimado, taxa_entrega,
    chave_pix, formas_pagamento_aceitas
  } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE restaurante_config SET
        nome = $1, descricao = $2, logo_url = $3, capa_url = $4,
        cor_primaria_clara = $5, cor_secundaria_clara = $6,
        cor_primaria_escura = $7, cor_secundaria_escura = $8,
        endereco = $9, dias_funcionamento = $10, horario_funcionamento = $11,
        telefone = $12, tempo_preparo_estimado = $13, taxa_entrega = $14,
        chave_pix = $15, formas_pagamento_aceitas = $16
       WHERE id = 1
       RETURNING *`,
      [nome, descricao, logo_url, capa_url,
       cor_primaria_clara, cor_secundaria_clara,
       cor_primaria_escura, cor_secundaria_escura,
       endereco, dias_funcionamento, horario_funcionamento,
       telefone, tempo_preparo_estimado, taxa_entrega,
       chave_pix, JSON.stringify(formas_pagamento_aceitas)]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar configuração.' });
  }
});

// GET /api/mesas — lista todas as mesas
router.get('/mesas', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM mesas ORDER BY numero');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar mesas.' });
  }
});

// POST /api/mesas — cria uma mesa nova
router.post('/mesas', async (req, res) => {
  const { numero, capacidade } = req.body;

  if (!numero || !capacidade) {
    return res.status(400).json({ mensagem: 'numero e capacidade são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO mesas (numero, capacidade) VALUES ($1, $2) RETURNING *',
      [numero, capacidade]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar mesa.' });
  }
});

// PUT /api/mesas/:id — edita a capacidade (ou status) de uma mesa
router.put('/mesas/:id', async (req, res) => {
  const { capacidade, status } = req.body;

  try {
    const resultado = await pool.query(
      'UPDATE mesas SET capacidade = $1, status = $2 WHERE id = $3 RETURNING *',
      [capacidade, status, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao editar mesa.' });
  }
});

// DELETE /api/mesas/:id
router.delete('/mesas/:id', async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM mesas WHERE id = $1 RETURNING id', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao excluir mesa.' });
  }
});

// POST /api/mesas — cria uma mesa nova
router.post('/mesas', async (req, res) => {
  const { numero, capacidade, nome } = req.body;

  if (!numero || !capacidade) {
    return res.status(400).json({ mensagem: 'numero e capacidade são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO mesas (numero, capacidade, nome) VALUES ($1, $2, $3) RETURNING *',
      [numero, capacidade, nome ?? null]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar mesa.' });
  }
});

// PUT /api/mesas/:id — edita nome, capacidade ou status de uma mesa
router.put('/mesas/:id', async (req, res) => {
  const { capacidade, status, nome } = req.body;

  try {
    const resultado = await pool.query(
      'UPDATE mesas SET capacidade = $1, status = $2, nome = $3 WHERE id = $4 RETURNING *',
      [capacidade, status, nome ?? null, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Mesa não encontrada.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao editar mesa.' });
  }
});

// GET /api/salao — busca a configuração do salão de eventos
router.get('/salao', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM salao_eventos WHERE id = 1');
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar salão de eventos.' });
  }
});

// PUT /api/salao — atualiza a configuração do salão
router.put('/salao', async (req, res) => {
  const { nome, descricao, capacidade_pessoas, imagem_url, ativo } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE salao_eventos SET
        nome = $1, descricao = $2, capacidade_pessoas = $3, imagem_url = $4, ativo = $5
       WHERE id = 1
       RETURNING *`,
      [nome, descricao, capacidade_pessoas, imagem_url, ativo]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar salão de eventos.' });
  }
});

// GET /api/reservas-salao — lista reservas (com filtro opcional por status)
router.get('/reservas-salao', async (req, res) => {
  const { status } = req.query;

  try {
    const query = status
      ? { text: 'SELECT * FROM reservas_salao WHERE status = $1 ORDER BY data_evento', values: [status] }
      : { text: 'SELECT * FROM reservas_salao ORDER BY data_evento', values: [] };

    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar reservas.' });
  }
});

// POST /api/reservas-salao — o Admin cadastra uma reserva recebida por WhatsApp
router.post('/reservas-salao', async (req, res) => {
  const {
    nome_cliente, telefone_cliente, data_evento, horario_evento,
    quantidade_convidados, valor_combinado, observacoes
  } = req.body;

  if (!nome_cliente || !data_evento) {
    return res.status(400).json({ mensagem: 'nome_cliente e data_evento são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO reservas_salao
        (salao_id, nome_cliente, telefone_cliente, data_evento, horario_evento,
         quantidade_convidados, valor_combinado, observacoes)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nome_cliente, telefone_cliente, data_evento, horario_evento,
       quantidade_convidados, valor_combinado, observacoes]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar reserva.' });
  }
});

// PUT /api/reservas-salao/:id — atualiza o status (concluir ou cancelar)
router.put('/reservas-salao/:id', async (req, res) => {
  const { status } = req.body;

  if (!['ativa', 'concluida', 'cancelada'].includes(status)) {
    return res.status(400).json({ mensagem: 'status inválido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE reservas_salao SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Reserva não encontrada.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar reserva.' });
  }
});