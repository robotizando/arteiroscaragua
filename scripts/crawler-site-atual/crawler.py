#!/usr/bin/env python3
"""
Crawler de migração: site atual (arteiroscaragua.com.br) -> banco SQLite do sistema novo.

Lê a API pública do site atual (a mesma usada pelo frontend dele) e grava direto no SQLite:
  - GET /catalog/categories        -> tabela materiais (com foto em thumbnail)
  - GET /products                  -> lista de peças
  - GET /products/:id              -> arteiro_pecas + arteiro_peca_imagens
  - GET /artisan-profiles/:user    -> arteiros (autor de cada peça, avatar em logotipo)
                                      + usuarios (e-mail provisório) e usuario_arteiros
  - categorias de cada peça        -> arteiro_materiais

As fotos estão em URLs assinadas que expiram, por isso são baixadas e gravadas como blob.

Idempotente (pode rodar várias vezes):
  - material: casado pelo slug; se já existir, só preenche a thumbnail vazia;
  - arteiro: casado pelo nome; se já existir, só preenche telefone/biografia/logotipo vazios;
  - peça: casada por (arteiro, nome, descrição, valor), contando repetições — o site permite
    peças iguais no mesmo arteiro, então a N-ésima igual só é criada se o banco tiver menos de N.

Só usa a biblioteca padrão do Python (3.9+).

Uso:
  python3 scripts/crawler-site-atual/crawler.py [--db CAMINHO] [--api URL] [--dry-run] [--only materiais|pecas]
                                                [--dominio-email DOMINIO]
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DB_PADRAO = RAIZ / "apps" / "backend" / "data" / "dev.sqlite"
API_PADRAO = "https://arteiroscaragua.com.br/api"
DOMINIO_EMAIL_PADRAO = "importado.arteiroscaragua.com.br"
USER_AGENT = "arteiroscaragua-migracao/1.0"
TIMEOUT = 60
TENTATIVAS = 3


# --------------------------------------------------------------------------- HTTP

def http_get(url: str) -> tuple[bytes, str]:
    ultimo_erro: Exception | None = None
    for tentativa in range(1, TENTATIVAS + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                return res.read(), res.headers.get("Content-Type", "")
        except urllib.error.HTTPError as erro:
            if 400 <= erro.code < 500:  # repetir não resolve
                raise RuntimeError(f"HTTP {erro.code} em {url.split('?')[0]}") from erro
            ultimo_erro = erro
        except (urllib.error.URLError, TimeoutError) as erro:
            ultimo_erro = erro
        time.sleep(tentativa)
    raise RuntimeError(f"falha ao acessar {url.split('?')[0]}: {ultimo_erro}")


class Api:
    def __init__(self, base: str):
        self.base = base.rstrip("/")

    def get(self, caminho: str):
        corpo, _ = http_get(self.base + caminho)
        return json.loads(corpo)


def baixar_imagem(url: str) -> tuple[bytes, str]:
    corpo, content_type = http_get(url)
    mime = content_type.split(";")[0].strip() or "image/jpeg"
    if not mime.startswith("image/"):
        raise RuntimeError(f"conteúdo não é imagem ({mime}) em {url.split('?')[0]}")
    return corpo, mime


# --------------------------------------------------------------------------- utilitários

def agora() -> int:
    # Drizzle grava integer(mode: 'timestamp') em segundos.
    return int(time.time())


def slugify(valor: str) -> str:
    # Mesmo algoritmo de slugify() em apps/backend/src/modules/materiais/materiais.service.ts
    sem_acento = "".join(c for c in unicodedata.normalize("NFKD", valor) if not unicodedata.combining(c))
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", sem_acento.lower().strip()))


def log(msg: str) -> None:
    print(msg, flush=True)


# --------------------------------------------------------------------------- importação

class Importador:
    def __init__(self, conn: sqlite3.Connection, api: Api, dry_run: bool, dominio_email: str):
        self.db = conn
        self.api = api
        self.dry_run = dry_run
        self.dominio_email = dominio_email
        self.usuarios_criados = 0
        self.material_por_categoria: dict[int, str] = {}
        self.arteiro_por_username: dict[str, int] = {}
        self._categorias: list[dict] | None = None

    def categorias(self) -> list[dict]:
        if self._categorias is None:
            self._categorias = self.api.get("/catalog/categories")["items"]
        return self._categorias

    # ---- materiais

    def carregar_mapa_materiais(self) -> None:
        for cat in self.categorias():
            row = self.db.execute("SELECT id FROM materiais WHERE slug = ?", (slugify(cat["nameExhibit"]),)).fetchone()
            if row:
                self.material_por_categoria[cat["id"]] = row["id"]

    def importar_materiais(self) -> None:
        criados = atualizados = inalterados = 0
        ordem = (self.db.execute("SELECT MAX(ordem) FROM materiais").fetchone()[0] or 0) + 1

        for cat in self.categorias():
            nome = cat["nameExhibit"].strip()
            slug = slugify(nome)
            url = cat.get("imageUrl")
            existente = self.db.execute("SELECT id, nome, thumbnail IS NOT NULL AS tem_thumb FROM materiais WHERE slug = ?", (slug,)).fetchone()

            if existente:
                self.material_por_categoria[cat["id"]] = existente["id"]
                if existente["tem_thumb"] or not url:
                    inalterados += 1
                    continue
                log(f'  ~ material "{existente["nome"]}": thumbnail preenchida')
                atualizados += 1
                if not self.dry_run:
                    imagem, mime = baixar_imagem(url)
                    self.db.execute(
                        "UPDATE materiais SET thumbnail = ?, thumbnail_type = ?, updated_at = ? WHERE id = ?",
                        (imagem, mime, agora(), existente["id"]),
                    )
                    self.db.commit()
                continue

            log(f'  + material "{nome}" ({slug})')
            criados += 1
            if self.dry_run:
                continue
            imagem, mime = baixar_imagem(url) if url else (None, None)
            novo_id = str(uuid.uuid4())
            ts = agora()
            self.db.execute(
                """INSERT INTO materiais (id, nome, slug, descricao, thumbnail, thumbnail_type, ordem, estado, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?)""",
                (novo_id, nome, slug, cat.get("description") or f"Categoria {nome} importada do site atual.",
                 imagem, mime, ordem, ts, ts),
            )
            self.db.commit()
            ordem += 1
            self.material_por_categoria[cat["id"]] = novo_id

        log(f"✓ Materiais — criados: {criados} | thumbnail preenchida: {atualizados} | inalterados: {inalterados}")

    # ---- arteiros

    def resolver_arteiro(self, username: str) -> int:
        """Retorna o id local do arteiro autor da peça, criando-o a partir do perfil do site se preciso.
        Em dry-run, retorna -1 para arteiros que ainda não existem."""
        if username in self.arteiro_por_username:
            return self.arteiro_por_username[username]

        perfil = self.api.get(f"/artisan-profiles/{urllib.parse.quote(username)}")
        nome = (perfil.get("socialName") or perfil["artisanName"]).strip()
        existente = self.db.execute(
            "SELECT id, telefone, biografia, logotipo IS NOT NULL AS tem_logo FROM arteiros WHERE nome = ? AND deleted_at IS NULL",
            (nome,),
        ).fetchone()

        if self.dry_run:
            log(f'  {"=" if existente else "+"} arteiro "{nome}"')
            arteiro_id = existente["id"] if existente else -1
            self.garantir_usuario(arteiro_id, username, nome)
            self.arteiro_por_username[username] = arteiro_id
            return arteiro_id

        logo = mime = None
        if perfil.get("avatar") and not (existente and existente["tem_logo"]):
            try:
                logo, mime = baixar_imagem(perfil["avatar"])
            except RuntimeError as erro:
                log(f'  ! avatar de "{nome}" não baixado: {erro}')

        ts = agora()
        if existente:
            arteiro_id = existente["id"]
            self.db.execute(
                """UPDATE arteiros SET telefone = COALESCE(telefone, ?), biografia = COALESCE(biografia, ?),
                   logotipo = COALESCE(logotipo, ?), logotipo_type = COALESCE(logotipo_type, ?), updated_at = ?
                   WHERE id = ?""",
                (perfil.get("phoneNumber"), perfil.get("bio"), logo, mime, ts, arteiro_id),
            )
            log(f'  = arteiro "{nome}" (#{arteiro_id})')
        else:
            cur = self.db.execute(
                """INSERT INTO arteiros (nome, telefone, biografia, logotipo, logotipo_type, estado, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, 'ativo', ?, ?)""",
                (nome, perfil.get("phoneNumber"), perfil.get("bio"), logo, mime, ts, ts),
            )
            arteiro_id = cur.lastrowid
            log(f'  + arteiro "{nome}" (#{arteiro_id})')
        self.db.commit()

        self.garantir_usuario(arteiro_id, username, nome)
        self.arteiro_por_username[username] = arteiro_id
        return arteiro_id

    # ---- usuários

    def garantir_usuario(self, arteiro_id: int, username: str, nome: str) -> None:
        """Garante um usuário (não moderador, perfil não verificado) vinculado ao arteiro (usuario_arteiros).

        O site atual não expõe o e-mail, então é gravado um e-mail provisório único
        (<username>@<dominio>), sem senha e sem verificação, para ser trocado pelo real depois."""
        email = f"{username}@{self.dominio_email}".lower()

        vinculado = arteiro_id >= 0 and self.db.execute(
            "SELECT 1 FROM usuario_arteiros WHERE arteiro_id = ?", (arteiro_id,)
        ).fetchone()
        if vinculado:
            return

        usuario = self.db.execute("SELECT id FROM usuarios WHERE email = ?", (email,)).fetchone()
        log(f'    {"= usuário existente" if usuario else "+ usuário"} {email}')
        self.usuarios_criados += 0 if usuario else 1
        if self.dry_run:
            return

        ts = agora()
        with self.db:  # transação
            if usuario:
                usuario_id = usuario["id"]
            else:
                usuario_id = str(uuid.uuid4())
                self.db.execute(
                    """INSERT INTO usuarios (id, nome, email, senha_hash, moderador, arteiro_verificado, estado, email_verificado_em, created_at, updated_at)
                       VALUES (?, ?, ?, NULL, 0, 0, 'ativo', NULL, ?, ?)""",
                    (usuario_id, nome, email, ts, ts),
                )
            self.db.execute(
                "INSERT OR IGNORE INTO usuario_arteiros (usuario_id, arteiro_id, created_at) VALUES (?, ?, ?)",
                (usuario_id, arteiro_id, ts),
            )

    def vincular_materiais(self, arteiro_id: int, category_ids: list[int]) -> None:
        ids = [self.material_por_categoria[c] for c in category_ids if c in self.material_por_categoria]
        if not ids or self.dry_run:
            return
        self.db.executemany(
            "INSERT OR IGNORE INTO arteiro_materiais (arteiro_id, material_id) VALUES (?, ?)",
            [(arteiro_id, m) for m in ids],
        )
        self.db.commit()

    # ---- peças

    def importar_pecas(self) -> int:
        lista = self.api.get("/products")
        criadas = existentes = falhas = imagens_salvas = 0
        ocorrencias: dict[tuple, int] = {}
        por_autor: dict[str, list[int]] = {}  # username -> [esperado, encontrado]

        for resumo in lista:
            try:
                produto = self.api.get(f"/products/{resumo['id']}")
                contagem = por_autor.setdefault(produto["authorUserName"], [produto.get("authorProductsCount") or 0, 0])
                contagem[1] += 1

                arteiro_id = self.resolver_arteiro(produto["authorUserName"])
                self.vincular_materiais(arteiro_id, produto.get("categoryIds") or [])

                nome = produto["title"].strip()
                descricao = (produto.get("description") or "").strip() or nome
                valor = produto["priceInCents"] / 100 if produto.get("priceInCents") is not None else None

                chave = (arteiro_id, nome, descricao, valor)
                ocorrencias[chave] = ocorrencias.get(chave, 0) + 1
                iguais = self.db.execute(
                    """SELECT COUNT(*) FROM arteiro_pecas
                       WHERE arteiro_id = ? AND nome = ? AND descricao = ? AND valor_sugerido IS ?""",
                    chave,
                ).fetchone()[0]
                if iguais >= ocorrencias[chave]:
                    existentes += 1
                    continue

                fotos = produto.get("photos") or []
                log(f'  + peça "{nome}" ({len(fotos)} foto(s))')
                criadas += 1
                if self.dry_run:
                    continue

                # Baixa tudo antes de gravar, para não deixar peça sem imagem por falha no meio.
                imagens = [baixar_imagem(url) for url in fotos]
                ts = agora()
                with self.db:  # transação
                    cur = self.db.execute(
                        """INSERT INTO arteiro_pecas (arteiro_id, nome, valor_sugerido, descricao, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (arteiro_id, nome, valor, descricao, ts, ts),
                    )
                    self.db.executemany(
                        "INSERT INTO arteiro_peca_imagens (peca_id, imagem, imagem_type, ordem) VALUES (?, ?, ?, ?)",
                        [(cur.lastrowid, img, mime, i) for i, (img, mime) in enumerate(imagens)],
                    )
                imagens_salvas += len(imagens)
            except Exception as erro:  # segue para a próxima peça
                falhas += 1
                log(f'  ✗ produto {resumo["id"]} ("{resumo.get("title")}"): {erro}')

        for username, (esperado, encontrado) in por_autor.items():
            if esperado > encontrado:
                log(f"  ! {username}: site informa {esperado} produtos, a listagem trouxe {encontrado}")

        log(f"✓ Peças — criadas: {criadas} ({imagens_salvas} imagens) | já existentes: {existentes} | falhas: {falhas}")
        log(f"✓ Usuários arteiros criados: {self.usuarios_criados}")
        return falhas


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa materiais, arteiros e peças do site atual para o SQLite do sistema novo.")
    parser.add_argument("--db", default=str(DB_PADRAO), help=f"arquivo SQLite de destino (padrão: {DB_PADRAO.relative_to(RAIZ)})")
    parser.add_argument("--api", default=API_PADRAO, help=f"URL base da API do site atual (padrão: {API_PADRAO})")
    parser.add_argument("--dry-run", action="store_true", help="só mostra o que seria feito, sem gravar nem baixar imagens")
    parser.add_argument("--only", choices=["materiais", "pecas"], help="importa só uma parte")
    parser.add_argument("--dominio-email", default=DOMINIO_EMAIL_PADRAO,
                        help=f"domínio do e-mail provisório dos usuários arteiros (padrão: {DOMINIO_EMAIL_PADRAO})")
    args = parser.parse_args()

    db_path = Path(args.db)
    if not db_path.exists():
        log(f"Banco não encontrado: {db_path} (rode as migrations do backend antes)")
        return 1

    conn = sqlite3.connect(f"file:{db_path}?mode=ro" if args.dry_run else db_path, uri=args.dry_run, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    log(f"Importando de {args.api} para {db_path}{' (dry-run, nada será gravado)' if args.dry_run else ''}")
    importador = Importador(conn, Api(args.api), args.dry_run, args.dominio_email)
    try:
        if args.only in (None, "materiais"):
            importador.importar_materiais()
        else:
            importador.carregar_mapa_materiais()
        falhas = importador.importar_pecas() if args.only in (None, "pecas") else 0
    finally:
        conn.close()
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
