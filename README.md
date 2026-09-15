# arteiroscaragua

Versão 2 do site arteiroscaragua.com.br — monorepo TypeScript (pnpm workspaces + Turborepo).

## Estrutura

- `apps/backend` — API em Express + Drizzle ORM (SQLite por enquanto).
- `apps/admin` — painel administrativo em Next.js + Tailwind + shadcn/ui.
- `packages/shared-types` — tipos e schemas (zod) compartilhados entre backend e admin.

## Pré-requisitos

- Node 20+
- pnpm (`corepack enable` ou `npm i -g pnpm`)
- Credenciais OAuth do Google (Google Cloud Console) para o login da Admin

## Configuração

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/admin/.env.example apps/admin/.env.local
```

Edite `apps/backend/.env` e preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
(crie um "OAuth 2.0 Client ID" do tipo *Web application* no Google Cloud Console,
com a "Authorized redirect URI" `http://localhost:4001/api/auth/google/callback`).

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

Login na Admin é feito exclusivamente via Google e restrito aos e-mails
cadastrados na tabela `admin_users` (tela "Usuários admin" dentro da própria
Admin). A sessão dura 10 minutos.
