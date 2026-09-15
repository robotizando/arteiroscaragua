# arteiroscaragua

Versão 2 do site arteiroscaragua.com.br — monorepo TypeScript (pnpm workspaces + Turborepo).

## Estrutura

- `apps/backend` — API em Express + Drizzle ORM (SQLite por enquanto).
- `apps/admin` — painel administrativo em Next.js + Tailwind + shadcn/ui.
- `apps/frontend` — site público (vitrine de peças e arteiros, cadastro e login de arteiros) em Next.js + Tailwind.
- `packages/shared-types` — tipos e schemas (zod) compartilhados entre backend, admin e frontend.

## Pré-requisitos

- Node 20+
- pnpm (`corepack enable` ou `npm i -g pnpm`)
- Credenciais OAuth do Google (Google Cloud Console) para o login da Admin

## Configuração

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edite `apps/backend/.env` e preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
(crie um "OAuth 2.0 Client ID" do tipo *Web application* no Google Cloud Console,
com as "Authorized redirect URIs" `http://localhost:4001/api/auth/google/callback` (Admin)
e `http://localhost:4001/api/conta/google/callback` (site)).

Os e-mails de confirmação de conta e de recuperação de senha usam SMTP (`SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`). Sem `SMTP_HOST`, o backend só exibe o e-mail, com o link,
no console — suficiente para testar o fluxo em desenvolvimento.

## Banco de dados

```bash
pnpm run db:migrate   # aplica as migrations (drizzle-kit)
pnpm run db:seed      # cria o admin padrão (robotizando.brasil@gmail.com)
```

Para gerar uma nova migration depois de alterar `apps/backend/src/database/schema.ts`:

```bash
pnpm --filter backend run db:generate
```

## Rodando em desenvolvimento

```bash
pnpm run dev
```

- Backend: http://localhost:4001
- Admin: http://localhost:4002
- Site (frontend): http://localhost:4003

Login na Admin é feito exclusivamente via Google e restrito aos e-mails
cadastrados na tabela `admin_users` (tela "Usuários admin" dentro da própria
Admin). A sessão dura 10 minutos.

## Usuários do site

Usuários "normais" (arteiros e moderadores) ficam na tabela `usuarios`, separada de
`admin_users`, e são gerenciados na tela "Usuários" da Admin. Todo login e tentativa de
login (Admin e site) é registrado em `acessos_log` (tela "Log de acesso").

No site, o arteiro se cadastra com Google ou com e-mail e senha (com confirmação do e-mail
por link) e entra pelas mesmas opções (API em `/api/conta`). A área logada ainda será construída;
veja [`docs/usuarios-arteiros-autenticacao.md`](docs/usuarios-arteiros-autenticacao.md).

## Site público

A vitrine lê a API pública `/api/publico` (sem autenticação), que só expõe arteiros ativos
e não expõe o SICAB nem o telefone como cadastrado (só o número normalizado para o botão de
WhatsApp da página da peça). O filtro por material traz as peças de arteiros que trabalham com o
material ou as peças que têm o material no próprio cadastro. O logotipo do site é enviado na tela
"Configurações do site" da Admin.
