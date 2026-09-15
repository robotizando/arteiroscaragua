# Crawler do site atual

Script de migração que lê o site atual (arteiroscaragua.com.br) e grava os dados no banco SQLite do sistema novo. Ele fica fora do backend e não depende de nada do projeto: usa só a biblioteca padrão do Python 3.9+.

## O que é importado

| Origem (API do site atual)       | Destino                                          |
| -------------------------------- | ------------------------------------------------ |
| `GET /catalog/categories`        | `materiais` (foto da categoria em `thumbnail`)   |
| `GET /products` + `/products/:id`| `arteiro_pecas` + `arteiro_peca_imagens`         |
| `GET /artisan-profiles/:user`    | `arteiros` (autor da peça, avatar em `logotipo`) |
| perfil do autor                  | `usuarios` (sem moderador, perfil não verificado) + `usuario_arteiros` |
| categorias de cada peça          | `arteiro_materiais`                              |

### Usuários arteiros

Cada arteiro importado recebe um usuário (não moderador e com perfil não verificado), vinculado a ele em `usuario_arteiros`. O site atual não mostra o e-mail do arteiro, então o usuário é criado com:

- e-mail provisório único `<userName do site>@importado.arteiroscaragua.com.br` (o domínio muda com `--dominio-email`);
- sem senha (`senha_hash` nulo) e sem verificação (`email_verificado_em` nulo).

Esse usuário não consegue entrar até alguém trocar o e-mail pelo real, pela Admin.

As fotos ficam em URLs assinadas que expiram, então o script baixa as imagens e grava o conteúdo como blob.

O `/catalog/materials` do site não tem fotos, por isso as fotos de material vêm das categorias.

## Uso

```bash
# ver o que seria feito (não grava nem baixa imagens)
python3 scripts/crawler-site-atual/crawler.py --dry-run

# importar para o banco de dev (apps/backend/data/dev.sqlite)
python3 scripts/crawler-site-atual/crawler.py

# outro banco, ou só uma parte
python3 scripts/crawler-site-atual/crawler.py --db /caminho/prod.sqlite
python3 scripts/crawler-site-atual/crawler.py --only materiais
python3 scripts/crawler-site-atual/crawler.py --only pecas
```

O banco precisa já ter as migrations aplicadas (`pnpm --filter backend db:migrate`).

## Pode rodar mais de uma vez

Nenhuma execução duplica dados:

- **Material**: identificado pelo slug. Se já existir, o script só preenche a thumbnail quando ela estiver vazia.
- **Arteiro**: identificado pelo nome. Se já existir, o script só preenche telefone, biografia e logotipo quando estiverem vazios.
- **Usuário**: se o arteiro já tiver um usuário vinculado, nada é feito. Se não tiver, o script reaproveita o usuário com o mesmo e-mail provisório ou cria um novo.
- **Peça**: identificada por (arteiro, nome, descrição, valor). O site permite peças idênticas no mesmo arteiro, então as repetições são contadas: se o site tem N peças iguais, o script garante N no banco.

O script mostra um aviso quando a listagem traz menos produtos de um arteiro do que o perfil dele informa.
