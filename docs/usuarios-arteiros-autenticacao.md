# Autenticação de usuários do site (arteiros) — plano de implementação

Status: **implementado** (backend `apps/backend/src/modules/conta`, telas em `apps/frontend`).
Cadastro, confirmação de e-mail, login (e-mail/senha e Google), recuperação de senha, aceite
de termos, `GET /me` e a área logada do site (boas-vindas, perfil e favoritos) estão prontos.
O plano original segue abaixo como referência.

Diferenças em relação ao plano:

- **O cadastro não cria mais um perfil de arteiro.** Quem se cadastra vira usuário comum; no
  primeiro acesso um modal pergunta se a pessoa é artesã e, com o número do SICAB, cria o perfil
  de arteiro em branco (ver "Primeiro acesso e perfil" abaixo).
- O token de sessão (e o de cadastro pendente do Google) volta do backend no fragmento da URL
  (`/auth/callback#token=...`), não na query, para não aparecer em logs do servidor do site.
- Um cadastro com e-mail já existente responde igual a um cadastro novo (201); o dono do e-mail
  recebe um aviso de "você já tem uma conta" (ou um novo link, se a conta não foi confirmada).
- Ao vincular o Google a uma conta que nunca confirmou o e-mail, a senha existente é descartada
  (ela pode ter sido definida por outra pessoa).
- Redefinir a senha grava `usuarios.senha_alterada_em`; tokens emitidos antes disso deixam de valer.

## O que já está pronto

| Item | Onde |
| --- | --- |
| Tabela `usuarios` (separada de `admin_users`) | `apps/backend/src/database/schema.ts` |
| Tabela n..n `usuario_arteiros` (hoje limitada a 1 perfil por usuário, `USUARIO_MAX_ARTEIROS`) | idem |
| Tabela `acessos_log` (todo login e toda tentativa, admin e site) | idem |
| Política de senha (`senhaSchema`) | `packages/shared-types/src/usuario.ts` |
| Hash/compare bcrypt (`hashSenha`, `compararSenha`, custo `BCRYPT_COST`, mínimo 10, padrão 12) | `apps/backend/src/modules/usuarios/senha.ts` |
| Registro no log (`registrarAcesso`) | `apps/backend/src/modules/acessos/acessos.service.ts` |
| CRUD Admin: `/api/usuarios` e consulta `/api/acessos` | `apps/backend/src/modules/usuarios`, `.../acessos` |
| Telas Admin: Usuários e Log de acesso | `apps/admin/src/app/dashboard/usuarios`, `.../acessos` |

Campos relevantes de `usuarios`: `senha_hash` (nulo para quem só usa Google),
`google_id` (único), `moderador` (flag), `arteiro_verificado` (flag), `estado` (`ativo` | `bloqueado`),
`email_verificado_em`, `termos_aceitos_em`, `ultimo_login_em`, `deleted_at`.

Não há "tipo" de usuário: ser arteiro é ter vínculo em `usuario_arteiros`, e `moderador` é uma
flag independente (um usuário com ou sem perfil de arteiro pode ser moderador).
`arteiro_verificado` marca o perfil de artesão como verificado; só é aceito com perfil vinculado
e é desmarcado automaticamente quando o vínculo é trocado ou removido.

## Regras de negócio

- **Google é o caminho preferencial**: na tela de cadastro/login o botão "Continuar com Google"
  vem primeiro e com destaque; e-mail e senha fica como alternativa.
- **Dados do cadastro inicial**: nome, e-mail e senha (no Google, nome e e-mail vêm do perfil
  e não há senha).
- **Aceite obrigatório** dos termos de responsabilidade e de uso, nos dois fluxos. Gravar
  `termos_aceitos_em`. Sem aceite, não cria a conta.
- **Política de senha**: mínimo 8 caracteres, letra maiúscula, número e símbolo
  (máximo 72 por limitação do bcrypt). Validar no frontend e no backend com `senhaSchema`.
- **Senha armazenada com bcrypt**, custo >= 10 (`hashSenha`).
- **Verificação de e-mail** obrigatória no fluxo de e-mail e senha antes do primeiro login.
  No Google, o e-mail já vem verificado (`email_verified` do perfil) e grava `email_verificado_em`.
- **Recuperação de senha** por link temporário enviado por e-mail, **expira em 10 minutos**.
- **Ao se cadastrar como arteiro**: numa única transação, criar `usuarios`,
  criar `arteiros` (nome do usuário) e criar o vínculo em `usuario_arteiros`.
  O `usuarios.service.createUsuario` já faz isso e pode ser reaproveitado.
  (Mudou: no site isso acontece no modal de boas-vindas, não no cadastro — ver acima.)
- **Todo login e toda tentativa** (sucesso ou falha, inclusive verificação/recuperação
  malsucedida) chamam `registrarAcesso(req, { ator: 'usuario', ... })`.

## Primeiro acesso e perfil (área logada do site)

- `usuarios.boas_vindas_em` marca que a pessoa já respondeu ao modal do primeiro acesso.
  A migração `0011` preencheu a coluna para as contas que já existiam.
- `POST /api/conta/boas-vindas { sicab? }` responde ao modal: com o SICAB, cria `arteiros`
  (só com nome e SICAB) e o vínculo em `usuario_arteiros`, numa transação; sem ele, apenas
  marca o modal como respondido. Quem recusou pode criar o perfil depois, em "Meu perfil".
- `GET /api/conta/perfil` devolve a conta e, para quem é arteiro, o perfil completo.
  `PATCH /api/conta/perfil` edita o nome da conta (o e-mail não é editável no site).
- `/api/conta/arteiros/:arteiroId/...` espelha as rotas de edição da Admin (dados, materiais,
  peças e coleções filhas), mas um middleware exige que o `:arteiroId` seja o perfil vinculado
  a quem está logado — qualquer outro id responde 404. Os routers de `pecas` e das coleções
  filhas são os mesmos das rotas da Admin: a autenticação fica em quem monta.
- Favoritos: tabela `usuario_favoritos` (usuário + peça) e as rotas `GET /api/conta/favoritos`,
  `GET /api/conta/favoritos/ids` (para marcar o coração nos cards), `PUT` e `DELETE`
  `/api/conta/favoritos/:pecaId`. Só peças de arteiros ativos podem ser favoritadas.
- `GET /api/publico/materiais` lista os materiais ativos para os seletores do perfil.

## O que falta implementar

### 1. Tabela de tokens de uso único

```ts
export const USUARIO_TOKEN_TIPOS = ['verificacao_email', 'recuperacao_senha'] as const;

export const usuarioTokens = sqliteTable('usuario_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: text('usuario_id').notNull().references(() => usuarios.id),
  tipo: text('tipo', { enum: USUARIO_TOKEN_TIPOS }).notNull(),
  tokenHash: text('token_hash').notNull().unique(), // SHA-256 do token, nunca o token em claro
  expiraEm: integer('expira_em', { mode: 'timestamp' }).notNull(),
  usadoEm: integer('usado_em', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

- Token gerado com `crypto.randomBytes(32).toString('base64url')`; só o hash vai para o banco.
- Recuperação de senha: `expiraEm = agora + 10 min`. Verificação de e-mail: sugestão de 24 h.
- Ao gerar um token novo, invalidar (marcar `usadoEm`) os anteriores do mesmo tipo e usuário.
- Consumir o token numa transação: conferir `usadoEm IS NULL` e `expiraEm > agora`, e marcar como usado.

### 2. Envio de e-mail

- Ainda não existe infraestrutura de e-mail. Criar `apps/backend/src/modules/email/`
  (ex.: Nodemailer com SMTP ou um provedor transacional), com variáveis `SMTP_*` / `EMAIL_FROM`.
- Templates: verificação de conta e recuperação de senha.
- Em desenvolvimento, logar o link no console quando o SMTP não estiver configurado.

### 3. Sessão do usuário do site

- JWT próprio, **separado do token da Admin**: segredo diferente (`USER_JWT_SECRET`) ou
  claim `aud: 'site'`, para um token de usuário nunca ser aceito em rotas da Admin (e vice-versa).
- Payload: `{ sub: usuario.id }` (flags como `moderador` devem ser lidas do banco a cada requisição,
  para a revogação valer na hora).
- Middleware `requireUsuarioAuth` (espelho de `require-admin-auth.ts`): valida token, carrega o
  usuário, exige `estado = 'ativo'` e `deleted_at IS NULL`.
- Atualizar `ultimo_login_em` a cada login bem-sucedido.
- CORS: incluir a URL do novo frontend (`SITE_URL`) além de `ADMIN_URL`.

### 4. Endpoints (`/api/conta`)

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/cadastro` | `{ nome, email, senha, aceiteTermos: true }` → cria usuário + arteiro + vínculo, envia e-mail de verificação. Responder 201 sem token (login só após verificar). |
| POST | `/verificar-email` | `{ token }` → grava `email_verificado_em`. |
| POST | `/reenviar-verificacao` | `{ email }` → resposta sempre genérica (não revela se o e-mail existe). |
| POST | `/login` | `{ email, senha }` → token. Falhas: `credenciais_invalidas`, `email_nao_verificado`, `bloqueado`. |
| GET | `/google` e `/google/callback` | OAuth. Strategy separada (ex.: `passport.use('google-site', ...)`) com callback próprio. |
| POST | `/esqueci-senha` | `{ email }` → token de 10 min por e-mail. Resposta sempre genérica. |
| POST | `/redefinir-senha` | `{ token, senha }` → valida política, grava hash, consome token. |
| GET | `/me` | Dados do usuário e seus perfis de arteiro. |
| PATCH | `/arteiros/:id` | Edição do próprio perfil (verificar vínculo em `usuario_arteiros`). |

(Os dois últimos estão prontos; ver "Primeiro acesso e perfil".)

### 5. Fluxo Google (site)

1. Callback recebe o perfil; exigir `email` e `email_verified`.
2. Buscar por `google_id`; se não achar, buscar por `email`:
   - existe e não tem `google_id` → vincular `google_id` (o e-mail do Google é verificado);
   - não existe → **cadastro**: redirecionar ao frontend para aceitar os termos antes de criar a
     conta (ex.: token temporário assinado com `googleId`, `email`, `nome`, válido por poucos minutos,
     consumido por `POST /conta/google/concluir-cadastro { tokenCadastro, aceiteTermos: true }`).
3. Usuário bloqueado ou excluído → falha `bloqueado`, registrada no log.
4. Usuários criados pela Admin que ainda não aceitaram os termos (`termos_aceitos_em` nulo)
   devem aceitar no primeiro login.

### 6. Segurança

- Mensagens de erro genéricas no login ("e-mail ou senha inválidos"); o motivo detalhado vai só
  para o `acessos_log`.
- Rate limit por IP e por e-mail em `/login`, `/esqueci-senha` e `/reenviar-verificacao`
  (ex.: `express-rate-limit`). O `acessos_log` já permite contar falhas recentes por e-mail para
  bloqueio temporário.
- Para evitar diferença de tempo de resposta quando o e-mail não existe, rodar `compararSenha`
  contra um hash fictício.
- Ao redefinir a senha, invalidar sessões anteriores (ex.: campo `senha_alterada_em` comparado
  com o `iat` do JWT).
- Configurar `app.set('trust proxy', ...)` em produção para o IP do log ser o do cliente.

### 7. Pontos em aberto

- E-mails de usuários excluídos continuam ocupando o índice único de `usuarios.email`:
  decidir se um novo cadastro com o mesmo e-mail reativa a conta ou é bloqueado.
- Texto e versionamento dos termos (guardar a versão aceita além da data?).
- Fluxos do moderador (permissões e telas) ainda não definidos; por ora existe só a flag
  `usuarios.moderador`, marcada pela Admin.
