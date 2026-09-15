import type { EmailMensagem } from './email.service';

const SITE_NOME = 'Arteiros Caragua';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(titulo: string, paragrafos: string[], botao?: { texto: string; url: string }): string {
  const corpo = paragrafos.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p}</p>`).join('');
  const cta = botao
    ? `<p style="margin:24px 0"><a href="${escapeHtml(botao.url)}" style="background:#a8452a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(botao.texto)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#6b625b;line-height:1.5">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all">${escapeHtml(botao.url)}</span></p>`
    : '';
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f7f3ed;font-family:Arial,Helvetica,sans-serif;color:#2a2320">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#a8452a">${SITE_NOME}</p>
    <div style="background:#fff;border-radius:12px;padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(titulo)}</h1>
      ${corpo}${cta}
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#8a817a">Você recebeu este e-mail porque este endereço foi usado no ${SITE_NOME}. Se não foi você, pode ignorar esta mensagem.</p>
  </div></body></html>`;
}

export function verificacaoEmail(dados: { para: string; nome: string; link: string }): EmailMensagem {
  return {
    para: dados.para,
    assunto: `Confirme seu e-mail · ${SITE_NOME}`,
    texto: `Olá, ${dados.nome}!\n\nConfirme seu e-mail para ativar sua conta no ${SITE_NOME}:\n${dados.link}\n\nO link vale por 24 horas.`,
    html: layout(
      'Confirme seu e-mail',
      [`Olá, ${escapeHtml(dados.nome)}!`, `Falta pouco para você mostrar suas peças no ${SITE_NOME}. Confirme seu e-mail para ativar a conta. O link vale por 24 horas.`],
      { texto: 'Confirmar e-mail', url: dados.link },
    ),
  };
}

export function recuperacaoSenha(dados: { para: string; nome: string; link: string }): EmailMensagem {
  return {
    para: dados.para,
    assunto: `Redefinição de senha · ${SITE_NOME}`,
    texto: `Olá, ${dados.nome}!\n\nPara criar uma nova senha, acesse:\n${dados.link}\n\nO link vale por 10 minutos. Se você não pediu a redefinição, ignore este e-mail.`,
    html: layout(
      'Redefinição de senha',
      [`Olá, ${escapeHtml(dados.nome)}!`, 'Recebemos um pedido para redefinir a senha da sua conta. O link vale por <strong>10 minutos</strong>.'],
      { texto: 'Criar nova senha', url: dados.link },
    ),
  };
}

export function contaExistente(dados: {
  para: string;
  nome: string;
  linkEntrar: string;
  linkEsqueciSenha: string;
}): EmailMensagem {
  return {
    para: dados.para,
    assunto: `Você já tem uma conta · ${SITE_NOME}`,
    texto: `Olá, ${dados.nome}!\n\nAlguém tentou criar uma conta com este e-mail, mas você já está cadastrado.\nEntrar: ${dados.linkEntrar}\nEsqueceu a senha? ${dados.linkEsqueciSenha}`,
    html: layout(
      'Você já tem uma conta',
      [
        `Olá, ${escapeHtml(dados.nome)}!`,
        'Alguém tentou criar uma conta com este e-mail, mas ele já está cadastrado. Se foi você, é só entrar.',
        `Esqueceu a senha? <a href="${escapeHtml(dados.linkEsqueciSenha)}" style="color:#a8452a">Crie uma nova</a>.`,
      ],
      { texto: 'Entrar', url: dados.linkEntrar },
    ),
  };
}
