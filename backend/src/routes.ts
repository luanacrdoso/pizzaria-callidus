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