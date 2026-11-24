// Aplica no .env do servidor os secrets permitidos enviados pelo GitHub Actions.
// Uso: node sync-env.cjs <arquivo .env> <payload JSON>
// JWT_SECRET e USER_JWT_SECRET ficam de fora: são gerados no servidor, e um valor
// fraco impediria a API de iniciar.
const fs = require('fs');

const PERMITIDAS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'JWT_EXPIRES_IN',
];

function formatar(chave, valor) {
  if (/[\r\n]/.test(valor)) throw new Error(`${chave} não pode ter várias linhas`);
  if (/^[A-Za-z0-9_@%+=:,./-]*$/.test(valor)) return `${chave}=${valor}`;
  const aspas = ["'", '"', '`'].find((a) => !valor.includes(a));
  if (!aspas) throw new Error(`${chave} contém os três tipos de aspas`);
  return `${chave}=${aspas}${valor}${aspas}`;
}

const [arquivoEnv, arquivoPayload] = process.argv.slice(-2);

try {
  const payload = JSON.parse(fs.readFileSync(arquivoPayload, 'utf8'));
  const linhas = fs.readFileSync(arquivoEnv, 'utf8').replace(/\n$/, '').split('\n');
  const alteradas = [];

  for (const chave of PERMITIDAS) {
    const valor = String(payload[chave] ?? '').trim();
    if (!valor) continue;
    const nova = formatar(chave, valor);
    const indice = linhas.findIndex((l) => l.startsWith(`${chave}=`));
    if (indice === -1) linhas.push(nova);
    else if (linhas[indice] !== nova) linhas[indice] = nova;
    else continue;
    alteradas.push(chave);
  }

  if (alteradas.length > 0) {
    const temporario = `${arquivoEnv}.tmp`;
    fs.writeFileSync(temporario, `${linhas.join('\n')}\n`, { mode: 0o600 });
    fs.renameSync(temporario, arquivoEnv);
  }
  // Só nomes: valores nunca vão para o log.
  console.log(alteradas.length ? `Atualizadas: ${alteradas.join(', ')}` : 'Configuração já atualizada.');
} finally {
  fs.rmSync(arquivoPayload, { force: true });
}
