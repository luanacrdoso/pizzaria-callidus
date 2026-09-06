import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function enviarCodigoRecuperacao(destinatario: string, codigo: string) {
  await transporter.sendMail({
    from: `"Pizzaria Callidus" <${process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: 'Código de recuperação de senha',
    html: `<p>Seu código de recuperação é: <strong>${codigo}</strong></p><p>Ele expira em 15 minutos.</p>`
  });
}