import express from 'express';
import cors from 'cors';
import { pool } from './db';
import { router } from './routes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', horaDoBanco: resultado.rows[0].now });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ status: 'erro', mensagem: 'Não foi possível conectar ao banco.' });
  }
});

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));