import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface TokenPayload {
  id: number;
  username: string;
  tipo: 'admin' | 'funcionario';
  cargo?: string;
}

export function gerarToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

// Confirma que existe um token válido, seja de admin ou de funcionário
export function verificarAutenticado(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (req as any).usuario = payload;
    next();
  } catch {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

// Além de autenticado, exige que seja especificamente o admin
export function verificarAdmin(req: Request, res: Response, next: NextFunction) {
  verificarAutenticado(req, res, () => {
    const usuario = (req as any).usuario as TokenPayload;
    if (usuario.tipo !== 'admin') {
      return res.status(403).json({ mensagem: 'Acesso restrito ao Admin.' });
    }
    next();
  });
}