import nodemailer, { type Transporter } from 'nodemailer';
import { config, isEmailConfigured } from '../../config';

export interface EmailMensagem {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined,
  });
  return transporter;
}

// Sem SMTP configurado (desenvolvimento), o e-mail é só exibido no console, com os links.
export async function enviarEmail(mensagem: EmailMensagem): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(
      `\n[EMAIL] SMTP não configurado — e-mail não enviado.\n` +
        `  Para: ${mensagem.para}\n  Assunto: ${mensagem.assunto}\n\n${mensagem.texto}\n`,
    );
    return;
  }

  await getTransporter().sendMail({
    from: config.email.from,
    to: mensagem.para,
    subject: mensagem.assunto,
    text: mensagem.texto,
    html: mensagem.html,
  });
}
