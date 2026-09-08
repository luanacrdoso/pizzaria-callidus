import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from './db';
import { enviarCodigoRecuperacao } from './mailer';
import { gerarToken, verificarAdmin, verificarAutenticado, verificarEquipe, verificarCargo } from './auth';
export const router = Router();

function tabelaDoUsuario(tipo: string) {
  if (tipo === 'admin') return 'admins';
  if (tipo === 'cliente') return 'clientes';
  return 'funcionarios';
}

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

// POST /api/auth/funcionario/login — login de Balcão, Cozinha, Garçom, Motoboy
router.post('/auth/funcionario/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const resultado = await pool.query('SELECT * FROM funcionarios WHERE username = $1', [username]);
    const funcionario = resultado.rows[0];

    if (!funcionario || !(await bcrypt.compare(password, funcionario.senha_hash))) {
      return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }
    if (!funcionario.aprovado) {
      return res.status(403).json({ mensagem: 'Seu cadastro ainda não foi aprovado pelo Admin.' });
    }

    const token = gerarToken({
      id: funcionario.id, username: funcionario.username, tipo: 'funcionario', cargo: funcionario.cargo
    });
    res.json({ token, cargo: funcionario.cargo, nome: funcionario.nome });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao fazer login.' });
  }
});

// ========== PIZZAS (CARDÁPIO) ==========

// GET /api/pizzas — lista todo o cardápio
router.get('/pizzas', async (req, res) => {
  const { visivel } = req.query;
  try {
    const query = visivel === 'true'
      ? { text: 'SELECT * FROM pizzas WHERE visivel = true ORDER BY criado_em DESC', values: [] }
      : { text: 'SELECT * FROM pizzas ORDER BY criado_em DESC', values: [] };
    const resultado = await pool.query(query);
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
router.post('/mesas', verificarEquipe, async (req, res) => {
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
router.put('/mesas/:id', verificarEquipe, async (req, res) => {
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
router.delete('/mesas/:id', verificarEquipe, async (req, res) => {
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
    if (erro.code === '23505') {
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

// ========== PERFIL DO USUÁRIO LOGADO ==========

// GET /api/me — dados do usuário logado (admin, funcionário ou cliente)
router.get('/me', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  const tabela = tabelaDoUsuario(usuario.tipo);

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
  const tabela = tabelaDoUsuario(usuario.tipo);

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
  const tabela = tabelaDoUsuario(usuario.tipo);

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
    const existeCliente = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);

    if (existeAdmin.rows.length > 0 || existeFuncionario.rows.length > 0 || existeCliente.rows.length > 0) {
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        'INSERT INTO codigos_recuperacao (email, codigo, expira_em) VALUES ($1, $2, $3)',
        [email, codigo, expiraEm]
      );
      await enviarCodigoRecuperacao(email, codigo);
    }

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
      const funcionario = await pool.query('UPDATE funcionarios SET senha_hash = $1 WHERE email = $2 RETURNING id', [novoHash, email]);
      if (funcionario.rows.length === 0) {
        await pool.query('UPDATE clientes SET senha_hash = $1 WHERE email = $2', [novoHash, email]);
      }
    }

    await pool.query('UPDATE codigos_recuperacao SET usado = true WHERE id = $1', [resultadoCodigo.rows[0].id]);
    res.json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao redefinir senha.' });
  }
});

// ========== RESERVAS DE MESA ==========

// GET /api/reservas-mesa — lista reservas (com filtro opcional por status)
router.get('/reservas-mesa', async (req, res) => {
  const { status } = req.query;

  try {
    const query = status
      ? { text: 'SELECT * FROM reservas_mesa WHERE status = $1 ORDER BY data_reserva', values: [status] }
      : { text: 'SELECT * FROM reservas_mesa ORDER BY data_reserva', values: [] };

    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar reservas de mesa.' });
  }
});

// POST /api/reservas-mesa — o Admin cadastra uma reserva recebida por WhatsApp
router.post('/reservas-mesa', async (req, res) => {
  const { nome_cliente, telefone_cliente, data_reserva, horario_reserva, quantidade_pessoas, mesa_id, observacoes } = req.body;

  if (!nome_cliente || !data_reserva) {
    return res.status(400).json({ mensagem: 'nome_cliente e data_reserva são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO reservas_mesa
        (nome_cliente, telefone_cliente, data_reserva, horario_reserva, quantidade_pessoas, mesa_id, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nome_cliente, telefone_cliente, data_reserva, horario_reserva, quantidade_pessoas, mesa_id || null, observacoes]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar reserva de mesa.' });
  }
});

// PUT /api/reservas-mesa/:id — atualiza status ou atribui uma mesa
router.put('/reservas-mesa/:id', async (req, res) => {
  const { status, mesa_id } = req.body;

  if (status && !['ativa', 'concluida', 'cancelada'].includes(status)) {
    return res.status(400).json({ mensagem: 'status inválido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE reservas_mesa SET status = COALESCE($1, status), mesa_id = COALESCE($2, mesa_id) WHERE id = $3 RETURNING *',
      [status, mesa_id, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Reserva não encontrada.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar reserva de mesa.' });
  }
});

// ========== CUPONS DE DESCONTO ==========

// GET /api/cupons — lista todos (protegido, só Admin)
router.get('/cupons', verificarAdmin, async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM cupons ORDER BY criado_em DESC');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar cupons.' });
  }
});

// POST /api/cupons — cria um cupom (protegido)
router.post('/cupons', verificarAdmin, async (req, res) => {
  const { codigo, tipo, valor, validade_inicio, validade_fim, limite_usos } = req.body;

  if (!codigo || !tipo || valor === undefined) {
    return res.status(400).json({ mensagem: 'codigo, tipo e valor são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO cupons (codigo, tipo, valor, validade_inicio, validade_fim, limite_usos)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [codigo.toUpperCase(), tipo, valor, validade_inicio || null, validade_fim || null, limite_usos || null]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro: any) {
    if (erro.code === '23505') {
      return res.status(409).json({ mensagem: 'Já existe um cupom com esse código.' });
    }
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar cupom.' });
  }
});

// PUT /api/cupons/:id — edita ou ativa/desativa (protegido)
router.put('/cupons/:id', verificarAdmin, async (req, res) => {
  const { tipo, valor, ativo, validade_inicio, validade_fim, limite_usos } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE cupons SET
        tipo = $1, valor = $2, ativo = $3, validade_inicio = $4, validade_fim = $5, limite_usos = $6
       WHERE id = $7 RETURNING *`,
      [tipo, valor, ativo, validade_inicio || null, validade_fim || null, limite_usos || null, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cupom não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar cupom.' });
  }
});

// DELETE /api/cupons/:id (protegido)
router.delete('/cupons/:id', verificarAdmin, async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM cupons WHERE id = $1 RETURNING id', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cupom não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao excluir cupom.' });
  }
});

// POST /api/cupons/validar — usado pelo Cliente no checkout (rota pública)
router.post('/cupons/validar', async (req, res) => {
  const { codigo, subtotal, taxa_entrega } = req.body;

  if (!codigo || subtotal === undefined) {
    return res.status(400).json({ mensagem: 'codigo e subtotal são obrigatórios.' });
  }

  try {
    const resultado = await pool.query('SELECT * FROM cupons WHERE codigo = $1', [codigo.toUpperCase()]);
    const cupom = resultado.rows[0];

    if (!cupom) {
      return res.status(404).json({ mensagem: 'Cupom não encontrado.' });
    }
    if (!cupom.ativo) {
      return res.status(400).json({ mensagem: 'Este cupom não está mais ativo.' });
    }
    const hoje = new Date().toISOString().slice(0, 10);
    if (cupom.validade_inicio && hoje < cupom.validade_inicio) {
      return res.status(400).json({ mensagem: 'Este cupom ainda não é válido.' });
    }
    if (cupom.validade_fim && hoje > cupom.validade_fim) {
      return res.status(400).json({ mensagem: 'Este cupom expirou.' });
    }
    if (cupom.limite_usos !== null && cupom.usos_atuais >= cupom.limite_usos) {
      return res.status(400).json({ mensagem: 'Este cupom atingiu o limite de usos.' });
    }

    let valorDesconto: number;
    let aplicaEm: 'subtotal' | 'entrega';

    if (cupom.tipo === 'percentual') {
      valorDesconto = Number(subtotal) * (Number(cupom.valor) / 100);
      aplicaEm = 'subtotal';
    } else if (cupom.tipo === 'valor_fixo') {
      valorDesconto = Math.min(Number(cupom.valor), Number(subtotal));
      aplicaEm = 'subtotal';
    } else {
      valorDesconto = Number(taxa_entrega) || 0;
      aplicaEm = 'entrega';
    }

    res.json({
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor_desconto: Number(valorDesconto.toFixed(2)),
      aplica_em: aplicaEm
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao validar cupom.' });
  }
});

// ========== CLIENTES ==========

router.post('/clientes', async (req, res) => {
  const { username, senha, nome, telefone, email, cpf, cep, endereco, numero, bairro, cidade, estado } = req.body;

  if (!username || !senha || !nome) {
    return res.status(400).json({ mensagem: 'username, senha e nome são obrigatórios.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
      `INSERT INTO clientes (username, senha_hash, nome, telefone, email, cpf, cep, endereco, numero, bairro, cidade, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, username, nome, telefone, email, cpf, cep, endereco, numero, bairro, cidade, estado`,
      [username, senhaHash, nome, telefone, email, cpf, cep, endereco, numero, bairro, cidade, estado]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro: any) {
    if (erro.code === '23505') {
      return res.status(409).json({ mensagem: 'Esse nome de usuário já existe.' });
    }
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar cliente.' });
  }
});

router.post('/auth/cliente/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const resultado = await pool.query('SELECT * FROM clientes WHERE username = $1', [username]);
    const cliente = resultado.rows[0];

    if (!cliente || !(await bcrypt.compare(password, cliente.senha_hash))) {
      return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }

    const token = gerarToken({ id: cliente.id, username: cliente.username, tipo: 'cliente' });
    res.json({ token });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao fazer login.' });
  }
});

// GET /api/clientes/meu-perfil — dados completos do cliente logado (endereço, CPF)
router.get('/clientes/meu-perfil', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  if (usuario.tipo !== 'cliente') {
    return res.status(403).json({ mensagem: 'Rota exclusiva para clientes.' });
  }
  try {
    const resultado = await pool.query(
      `SELECT id, username, nome, telefone, email, cpf, cep, endereco, numero, bairro, cidade, estado
       FROM clientes WHERE id = $1`,
      [usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar perfil.' });
  }
});

// PUT /api/clientes/meu-perfil — atualiza dados pessoais e endereço
router.put('/clientes/meu-perfil', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  if (usuario.tipo !== 'cliente') {
    return res.status(403).json({ mensagem: 'Rota exclusiva para clientes.' });
  }
  const { nome, telefone, cpf, cep, endereco, numero, bairro, cidade, estado } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE clientes SET nome = $1, telefone = $2, cpf = $3, cep = $4, endereco = $5,
        numero = $6, bairro = $7, cidade = $8, estado = $9
       WHERE id = $10
       RETURNING id, username, nome, telefone, email, cpf, cep, endereco, numero, bairro, cidade, estado`,
      [nome, telefone, cpf, cep, endereco, numero, bairro, cidade, estado, usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar perfil.' });
  }
});

// ========== PEDIDOS ==========

router.post('/pedidos', async (req, res) => {
  const {
    tipo, cliente_id, cliente_nome, cliente_telefone, mesa_id,
    itens, subtotal, taxa_entrega, total, endereco_entrega,
    cupom_codigo, valor_desconto, forma_pagamento
  } = req.body;

  if (!tipo || !itens || itens.length === 0) {
    return res.status(400).json({ mensagem: 'tipo e itens são obrigatórios.' });
  }

  const statusInicial = forma_pagamento === 'Pix' ? 'aguardando_pagamento' : 'recebido';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `INSERT INTO pedidos
        (tipo, cliente_id, cliente_nome, cliente_telefone, mesa_id, subtotal, taxa_entrega, total,
         endereco_entrega, cupom_codigo, valor_desconto, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [tipo, cliente_id || null, cliente_nome, cliente_telefone, mesa_id || null, subtotal,
       taxa_entrega || 0, total, endereco_entrega, cupom_codigo || null, valor_desconto || 0, statusInicial]
    );
    const pedido = pedidoResult.rows[0];

    for (const item of itens) {
      await client.query(
        `INSERT INTO itens_pedido (pedido_id, pizza_id, nome, tamanho, extras, observacoes, quantidade, preco_unitario)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [pedido.id, item.pizzaId || null, item.nome, item.tamanho, JSON.stringify(item.extras || []),
         item.observacoes || null, item.quantidade || 1, item.precoUnitario]
      );
    }

    await client.query(
      `INSERT INTO pedido_pagamentos (pedido_id, nome_pagador, valor_pago, forma_pagamento)
       VALUES ($1,$2,$3,$4)`,
      [pedido.id, cliente_nome, total, forma_pagamento]
    );

    if (cupom_codigo) {
      await client.query('UPDATE cupons SET usos_atuais = usos_atuais + 1 WHERE codigo = $1', [cupom_codigo.toUpperCase()]);
    }

    await client.query('COMMIT');
    res.status(201).json(pedido);
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao criar pedido.' });
  } finally {
    client.release();
  }
});

// IMPORTANTE: /pedidos/meus e as rotas fixas precisam vir ANTES de /pedidos/:id,
// senão o Express interpreta "meus" como se fosse um :id

router.get('/pedidos/meus', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  if (usuario.tipo !== 'cliente') {
    return res.status(403).json({ mensagem: 'Apenas clientes têm histórico de pedidos.' });
  }
  try {
    const resultado = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(i) FROM itens_pedido i WHERE i.pedido_id = p.id) AS itens
       FROM pedidos p WHERE p.cliente_id = $1 ORDER BY p.criado_em DESC`,
      [usuario.id]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar histórico.' });
  }
});

// GET /api/pedidos/pendentes-pagamento — pedidos Pix aguardando confirmação
router.get('/pedidos/pendentes-pagamento', verificarAdmin, async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT p.*, (SELECT json_agg(i) FROM itens_pedido i WHERE i.pedido_id = p.id) AS itens
       FROM pedidos p WHERE p.status = 'aguardando_pagamento' ORDER BY p.criado_em`
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pagamentos pendentes.' });
  }
});

router.get('/pedidos/:id', async (req, res) => {
  try {
    const pedido = await pool.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    if (pedido.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }
    const itens = await pool.query('SELECT * FROM itens_pedido WHERE pedido_id = $1', [req.params.id]);
    res.json({ ...pedido.rows[0], itens: itens.rows });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar pedido.' });
  }
});

// PUT /api/pedidos/:id/confirmar-pagamento — Admin confere que o Pix caiu de verdade
router.put('/pedidos/:id/confirmar-pagamento', verificarAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      "UPDATE pedidos SET status = 'recebido' WHERE id = $1 AND status = 'aguardando_pagamento' RETURNING *",
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado ou já processado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao confirmar pagamento.' });
  }
});

// PUT /api/pedidos/:id/recusar-pagamento — Admin não encontrou o pagamento na conta
router.put('/pedidos/:id/recusar-pagamento', verificarAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      "UPDATE pedidos SET status = 'cancelado' WHERE id = $1 AND status = 'aguardando_pagamento' RETURNING *",
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado ou já processado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao recusar pagamento.' });
  }
});

// ========== EDIÇÃO DE ITENS DE UM PEDIDO (equipe: admin ou funcionário) ==========

async function recalcularTotalPedido(pedidoId: number) {
  const itensResult = await pool.query(
    "SELECT preco_unitario, quantidade FROM itens_pedido WHERE pedido_id = $1 AND status = 'ativo'",
    [pedidoId]
  );
  const subtotal = itensResult.rows.reduce((s, i) => s + Number(i.preco_unitario) * i.quantidade, 0);

  const pedidoResult = await pool.query('SELECT taxa_entrega, valor_desconto FROM pedidos WHERE id = $1', [pedidoId]);
  const { taxa_entrega, valor_desconto } = pedidoResult.rows[0];
  const total = Math.max(0, subtotal + Number(taxa_entrega) - Number(valor_desconto));

  await pool.query('UPDATE pedidos SET subtotal = $1, total = $2 WHERE id = $3', [subtotal, total, pedidoId]);
}

// POST /api/pedidos/:id/itens — equipe adiciona um item extra a um pedido já em andamento
router.post('/pedidos/:id/itens', verificarEquipe, async (req, res) => {
  const { nome, tamanho, extras, observacoes, quantidade, preco_unitario, pizza_id } = req.body;

  if (!nome || !preco_unitario) {
    return res.status(400).json({ mensagem: 'nome e preco_unitario são obrigatórios.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO itens_pedido (pedido_id, pizza_id, nome, tamanho, extras, observacoes, quantidade, preco_unitario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, pizza_id || null, nome, tamanho || '', JSON.stringify(extras || []), observacoes || null, quantidade || 1, preco_unitario]
    );
    await recalcularTotalPedido(Number(req.params.id));
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao adicionar item.' });
  }
});

// PUT /api/pedidos/:id/itens/:itemId/cancelar — equipe cancela um item específico (risca, não apaga)
router.put('/pedidos/:id/itens/:itemId/cancelar', verificarEquipe, async (req, res) => {
  try {
    const resultado = await pool.query(
      "UPDATE itens_pedido SET status = 'cancelado' WHERE id = $1 AND pedido_id = $2 RETURNING *",
      [req.params.itemId, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    await recalcularTotalPedido(Number(req.params.id));
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao cancelar item.' });
  }
});

// PUT /api/pedidos/:id/status — equipe muda o status; cozinha só pode ir pra preparo/pronto
router.put('/pedidos/:id/status', verificarAutenticado, async (req, res) => {
  const usuario = (req as any).usuario;
  const { status } = req.body;
  const validos = ['aguardando_pagamento', 'recebido', 'preparo', 'pronto', 'entregue', 'finalizado', 'cancelado'];

  if (usuario.tipo === 'cliente') {
    return res.status(403).json({ mensagem: 'Acesso restrito à equipe da pizzaria.' });
  }
  if (!validos.includes(status)) {
    return res.status(400).json({ mensagem: 'status inválido.' });
  }
  if (usuario.tipo === 'funcionario' && usuario.cargo === 'cozinha' && !['preparo', 'pronto'].includes(status)) {
    return res.status(403).json({ mensagem: 'Cozinha só pode alterar o status para preparo ou pronto.' });
  }

  try {
    const resultado = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar status.' });
  }
});