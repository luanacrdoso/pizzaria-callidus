import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from './db';
import { gerarToken, verificarAdmin } from './auth';

export const router = Router();

// ========== AUTENTICAÇÃO ==========

// POST /api/auth/login — login do Admin (agora validado contra o banco)
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const resultado = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = resultado.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.senha_hash))) {
      return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }

    const token = gerarToken({ id: admin.id, username: admin.username, tipo: 'admin' });
    res.json({ token });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao fazer login.' });
  }
});

// ========== PIZZAS (CARDÁPIO) ==========

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

// ========== ADICIONAIS ==========

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

// ========== CONFIGURAÇÃO DA PIZZARIA ==========

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

// ========== MESAS ==========

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

// ========== SALÃO DE EVENTOS ==========

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

// ========== FUNCIONÁRIOS ==========

// POST /api/funcionarios — cadastro (público, fica pendente até o Admin aprovar)
router.post('/funcionarios', async (req, res) => {
  const { username, senha, nome, telefone, cargo } = req.body;

  if (!username || !senha || !nome || !cargo) {
    return res.status(400).json({ mensagem: 'username, senha, nome e cargo são obrigatórios.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
      `INSERT INTO funcionarios (username, senha_hash, nome, telefone, cargo)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nome, telefone, cargo, aprovado`,
      [username, senhaHash, nome, telefone, cargo]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro: any) {
    if (erro.code === '23505') { // código do Postgres pra violação de UNIQUE
      return res.status(409).json({ mensagem: 'Esse nome de usuário já existe.' });
    }
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar funcionário.' });
  }
});

// GET /api/funcionarios — lista todos (protegido, só Admin)
router.get('/funcionarios', verificarAdmin, async (_req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, username, nome, telefone, cargo, aprovado FROM funcionarios ORDER BY criado_em DESC'
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar funcionários.' });
  }
});

// PUT /api/funcionarios/:id/aprovar — aprova um funcionário pendente (protegido)
router.put('/funcionarios/:id/aprovar', verificarAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      'UPDATE funcionarios SET aprovado = true WHERE id = $1 RETURNING id, username, nome, cargo, aprovado',
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Funcionário não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao aprovar funcionário.' });
  }
});

// DELETE /api/funcionarios/:id — remove (reprovar pendente ou desligar ativo) (protegido)
router.delete('/funcionarios/:id', verificarAdmin, async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM funcionarios WHERE id = $1 RETURNING id', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Funcionário não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao remover funcionário.' });
  }
});

import { enviarCodigoRecuperacao } from './mailer';
import { verificarAutenticado } from './auth'; // adicionem junto do import que já existe de verificarAdmin

// ========== PERFIL DO USUÁRIO LOGADO ==========

// GET /api/me — dados do usuário logado (admin ou, futuramente, funcionário)
router.get('/me', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  const tabela = usuario.tipo === 'admin' ? 'admins' : 'funcionarios';

  try {
    const resultado = await pool.query(`SELECT id, username, email FROM ${tabela} WHERE id = $1`, [usuario.id]);
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar perfil.' });
  }
});

// PUT /api/me — edita username/e-mail (exige a senha atual)
router.put('/me', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  const { username, email, senha_atual } = req.body;
  const tabela = usuario.tipo === 'admin' ? 'admins' : 'funcionarios';

  try {
    const atual = await pool.query(`SELECT senha_hash FROM ${tabela} WHERE id = $1`, [usuario.id]);
    if (!atual.rows[0] || !(await bcrypt.compare(senha_atual, atual.rows[0].senha_hash))) {
      return res.status(401).json({ mensagem: 'Senha atual incorreta.' });
    }

    const resultado = await pool.query(
      `UPDATE ${tabela} SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email`,
      [username, email, usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (erro: any) {
    if (erro.code === '23505') {
      return res.status(409).json({ mensagem: 'Esse nome de usuário já existe.' });
    }
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar perfil.' });
  }
});

// PUT /api/me/senha — troca de senha (exige a senha atual)
router.put('/me/senha', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  const { senha_atual, nova_senha } = req.body;
  const tabela = usuario.tipo === 'admin' ? 'admins' : 'funcionarios';

  if (!nova_senha || nova_senha.length < 6) {
    return res.status(400).json({ mensagem: 'A nova senha precisa ter pelo menos 6 caracteres.' });
  }

  try {
    const atual = await pool.query(`SELECT senha_hash FROM ${tabela} WHERE id = $1`, [usuario.id]);
    if (!atual.rows[0] || !(await bcrypt.compare(senha_atual, atual.rows[0].senha_hash))) {
      return res.status(401).json({ mensagem: 'Senha atual incorreta.' });
    }

    const novoHash = await bcrypt.hash(nova_senha, 10);
    await pool.query(`UPDATE ${tabela} SET senha_hash = $1 WHERE id = $2`, [novoHash, usuario.id]);
    res.json({ mensagem: 'Senha atualizada com sucesso.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar senha.' });
  }
});

// ========== RECUPERAÇÃO DE SENHA POR E-MAIL ==========

// POST /api/auth/esqueci-senha — gera e envia o código
router.post('/auth/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ mensagem: 'email é obrigatório.' });

  try {
    const existeAdmin = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    const existeFuncionario = await pool.query('SELECT id FROM funcionarios WHERE email = $1', [email]);

    if (existeAdmin.rows.length > 0 || existeFuncionario.rows.length > 0) {
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        'INSERT INTO codigos_recuperacao (email, codigo, expira_em) VALUES ($1, $2, $3)',
        [email, codigo, expiraEm]
      );
      await enviarCodigoRecuperacao(email, codigo);
    }

    // Mesma resposta exista ou não o e-mail — evita que alguém descubra quais e-mails estão cadastrados
    res.json({ mensagem: 'Se esse e-mail estiver cadastrado, um código foi enviado.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao processar solicitação.' });
  }
});

// POST /api/auth/redefinir-senha — confirma o código e define a nova senha
router.post('/auth/redefinir-senha', async (req, res) => {
  const { email, codigo, nova_senha } = req.body;

  if (!email || !codigo || !nova_senha || nova_senha.length < 6) {
    return res.status(400).json({ mensagem: 'Dados inválidos.' });
  }

  try {
    const resultadoCodigo = await pool.query(
      `SELECT * FROM codigos_recuperacao
       WHERE email = $1 AND codigo = $2 AND usado = false AND expira_em > now()
       ORDER BY criado_em DESC LIMIT 1`,
      [email, codigo]
    );

    if (resultadoCodigo.rows.length === 0) {
      return res.status(400).json({ mensagem: 'Código inválido ou expirado.' });
    }

    const novoHash = await bcrypt.hash(nova_senha, 10);
    const admin = await pool.query('UPDATE admins SET senha_hash = $1 WHERE email = $2 RETURNING id', [novoHash, email]);
    if (admin.rows.length === 0) {
      await pool.query('UPDATE funcionarios SET senha_hash = $1 WHERE email = $2', [novoHash, email]);
    }

    await pool.query('UPDATE codigos_recuperacao SET usado = true WHERE id = $1', [resultadoCodigo.rows[0].id]);
    res.json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao redefinir senha.' });
  }
});