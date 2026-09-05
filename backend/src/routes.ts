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