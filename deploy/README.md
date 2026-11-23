# Deploy em produção

Cada push na `main` roda lint, build, typecheck e teste de migrações no GitHub Actions. Se tudo passar, a release é enviada por SSH e ativada no servidor.

| Endereço | Destino |
|---|---|
| `arteiroscaragua.com.br` | site, `127.0.0.1:4003` |
| `arteiroscaragua.com.br/api` | API, `127.0.0.1:4001` |
| `admin.arteiroscaragua.com.br` | admin, `127.0.0.1:4002` |

## Estrutura no servidor

```
/var/www/arteiroscaragua/
  current -> releases/<sha>    versão ativa
  previous -> releases/<sha>   versão anterior
  releases/                    últimas 5 versões
  shared/.env                  configuração de produção
  shared/data/                 banco SQLite, com as imagens
  shared/backups/              últimos 7 backups
```

## Configuração do GitHub

O passo a passo completo está em [docs/ci-cd.md](../docs/ci-cd.md).

- **Secrets do environment `production`:** `SSH_HOST`, `SSH_PORT`, `SSH_USER` (`deploy`), `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`.
- **Variables do repositório:** `NEXT_PUBLIC_API_URL=https://arteiroscaragua.com.br` (sem `/api`) e `NEXT_PUBLIC_SITE_URL=https://arteiroscaragua.com.br`.

## Instalação do servidor

Copie a pasta `deploy/` para o servidor e execute como root:

```bash
DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions" bash deploy/scripts/bootstrap-server.sh
```

Depois preencha SMTP e Google em `/var/www/arteiroscaragua/shared/.env`. Sem SMTP, os links de verificação e de redefinição de senha aparecem nos logs.

## Primeira carga de dados

Após o primeiro deploy, como usuário `deploy`:

```bash
cd /var/www/arteiroscaragua/current/apps/backend
NODE_ENV=production node dist/database/seed.js
```

Rode o importador em `scripts/crawler-site-atual/crawler.py` com `--db /var/www/arteiroscaragua/shared/data/production.sqlite`, **antes** de apontar o DNS, pois ele lê o site antigo.

## Virada do DNS e HTTPS

Aponte `@`, `www` e `admin` para o servidor e, com o DNS propagado, execute como root:

```bash
certbot --nginx --redirect \
  -d arteiroscaragua.com.br -d www.arteiroscaragua.com.br -d admin.arteiroscaragua.com.br
certbot renew --dry-run
```

## Operação

```bash
pm2 status
pm2 logs arteiros-api
```

**Rollback:** em Actions, abra **CI/CD**, clique em **Run workflow** e marque a release anterior ou informe um SHA. O rollback volta somente o código.

**Restaurar o banco** (ação manual, descarta dados gravados depois do backup):

```bash
pm2 stop arteiros-api
cd /var/www/arteiroscaragua/shared
gunzip -c backups/<arquivo>.sqlite.gz > data/restore.sqlite
sqlite3 data/restore.sqlite 'PRAGMA integrity_check;'
rm -f data/production.sqlite-wal data/production.sqlite-shm
mv data/restore.sqlite data/production.sqlite
pm2 start arteiros-api
```

Os backups ficam no próprio servidor e não protegem contra a perda da máquina.
