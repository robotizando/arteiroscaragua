# Handoff: Home Arteiros Caraguá (direção 1b "Vitrine")

## Prompt para o Claude Code

Cole isto no Claude Code, na raiz do monorepo `robotizando/arteiroscaragua`:

> Implemente o redesign da home do site público (`apps/frontend`) seguindo `design_handoff_home_vitrine/README.md`. Os arquivos HTML dessa pasta são referências de design (protótipo), não código para copiar. Recrie o leiaute nos componentes Next.js/Tailwind existentes (`page.tsx`, `site-header.tsx`, `pecas-filtros.tsx`, `peca-card.tsx`, `arteiro-card.tsx`, `button.tsx`). Passos: (1) substitua o `:root` de `src/app/globals.css` pelo conteúdo de `tokens/arteiros-tokens.css` (mesmas variáveis `hsl(var(--x))`, mais rampas `--mata-*`, `--mar-*`, `--coral-*`, `--areia-*`, `--neutro-*`); (2) mescle `tokens/tailwind.tokens.ts` em `theme.extend` do `tailwind.config.ts`; (3) troque as fontes Fraunces/Inter por Archivo (400/500/600/800) em `layout.tsx`, expondo `--font-display` e `--font-sans`; (4) implemente a tela "1b desktop" e "1b mobile" descritas abaixo. Raio de borda é 0 em tudo. Mantenha a API pública (`/api/publico`) e a lógica de filtros por URL que já existe; adicione o endpoint/consulta dos 5 arteiros com mais peças. Não altere a admin nem o backend além do necessário para esse top 5.

## Fidelidade
**Alta (hi-fi).** Cores, tipografia, espaçamentos e estados são finais. Fotos das peças são placeholders — usar `imagemUrl` real, sem filtro preto-e-branco.

## Onde estão os tokens
- `tokens/arteiros-tokens.css` — variáveis CSS (formato shadcn: `--primary: 146 60% 30%` etc.) + rampas hex + tipografia/espaço/estrutura. Substitui o `:root` atual de `globals.css`.
- `tokens/tailwind.tokens.ts` — `theme.extend` pronto para o `tailwind.config.ts` (cores, fontes, radius 0, sombras, `border-rule`/`border-grid`, `aspect-peca`).

## Direção visual
Estrutura "Modernist": plano, grade visível, **raio 0**, réguas de 2px entre seções, tudo alinhado à esquerda (inclusive rótulos de botões largos), uma família só (Archivo). Paleta da marca: verde Mata Atlântica (primário), azul-mar (secundário), coral (destaque), areia (fundo). Fotos coloridas, sem tratamento.

### Cores principais
| Papel | Hex | Uso |
| --- | --- | --- |
| background | #F6F3EC | fundo da página (areia) |
| foreground | #1B2A2F | texto/tinta |
| card | #FFFFFF | superfícies |
| primary / mata-600 | #1E7A43 | ações, links, foco |
| mata-700 | #155C33 | **cabeçalho** e **faixa "Novos arteiros"**; rótulo de material nos cards |
| mata-300 | #B5DCA1 | marca no header, botão "Tornar-se arteiro", linha da busca, ícone busca, tags |
| mata-800 | #0F4225 | texto sobre mata-300 |
| mata-100 | #EAF6EE | hover de superfícies |
| muted | #EAE5DA | listras do placeholder |
| muted-foreground | #5C6B6E | texto secundário |
| texto corpo em cards | #3B474B | bio |
| divider | rgba(27,42,47,.4) = 2px régua; rgba(27,42,47,.18) = 1px linha de grade |
| secondary / mar-600 | #1F7A8C | reservado (links secundários) |
| accent / coral-600 | #E0605F | reservado (destaque pontual) |
| whatsapp | #25D366 | botão WhatsApp na página da peça |

### Tipografia (Archivo)
- h1: 40px / 1.02 / 800 / -0.02em (mobile 32px)
- h2 seção: 40px / 1.05 / 800 (mobile 26px)
- Kicker: 11px caps, 0.08em, 800
- Nome da peça: 17px / 600 (mobile 14px); Valor: 15px / 800 tabular (mobile 14px)
- Meta (arteiro): 13px #5C6B6E; material: 11px caps 0.06em 600 #155C33
- Corpo: 15px / 1.5; itens do menu lateral 14px; botões 14px 800; input 14px

### Espaçamento
Container padding 32px desktop / 16px mobile. Header 56px (mobile 52px). Grade de peças: 3 colunas, gap 32px vertical × 24px horizontal (mobile 2 col, 20×12). Sidebar 260px, gap 48px até a grade. Faixa verde: padding 48px 32px 56px, margem superior 56px. Cards de arteiro: padding 24px, gap 16px (3 col).

## Telas

### 1b desktop (≥1024px)
**Header** — 56px, fundo #155C33, texto #F6F3EC, padding 0 32px, flex, gap 24px.
- Marca: quadrado 26px #B5DCA1 + "Arteiros Caraguá" 17px/800/-0.02em (logo real substitui o quadrado).
- Busca: flex 1, max 520px, margin-left 24px. Input 36px, sem borda, `border-bottom: 2px solid #B5DCA1`, fundo transparente, texto #F6F3EC, ícone Lucide `search` 16px #B5DCA1 à esquerda (padding-left 36px). Placeholder "Buscar por peça, arteiro ou descrição". Debounce 400ms → `?busca=` (já existe em pecas-filtros).
- Nav à direita (gap 20px, 14px): "Peças" #F6F3EC 600, "Arteiros" e "Entrar" #B5DCA1; botão "Tornar-se arteiro" 36px, padding 0 14px, fundo #B5DCA1, texto #0F4225 800, hover #CFEBD8. Sticky top, sem blur.

**Corpo** — grid `260px minmax(0,1fr)`, gap 48px, padding-top 40px.

*Sidebar (aside):*
- Bloco "Material": título 11px caps 800, border-bottom 2px #1B2A2F, margin-bottom 6px. Lista: botão "Todos" + um botão por material (só materiais com peças), texto à esquerda, contagem à direita (#5C6B6E, tabular). Cada item padding 8px 0, border-bottom 1px rgba(27,42,47,.18), 14px; selecionado = weight 800, hover cor #1E7A43. Clicar de novo desmarca. Mapeia para `?material=`.
- Bloco "Arteiro": mesmo título. Botão "Todos" + **top 5 arteiros por total de peças** (nome truncado à esquerda, `totalPecas` à direita), mesmo estilo dos itens de material. Abaixo, select "Outros arteiros…" (40px, border 2px #1B2A2F, fundo branco, 13px 600) com todos os arteiros ativos. Mapeia para `?arteiro=`. Requer consulta `/api/publico/arteiros?orderBy=totalPecas&limit=5` (ou equivalente).
- "Limpar filtros": link-botão 13px 800 #1E7A43, border-bottom 2px, sem fundo. Limpa busca, material e arteiro.

*Resultados:*
- Cabeçalho: flex space-between, align end, border-bottom 2px #1B2A2F, padding-bottom 16px. h1 "Feito à mão no litoral norte" (max 620px) + contador "N peças encontradas" 13px #5C6B6E (aria-live).
- Grade 3 col. Card = `<Link>` sem fundo: imagem 4:5 `object-cover`, border 1px rgba(27,42,47,.18); linha nome (17/600) + valor (15/800, flex-shrink 0) com space-between, gap 12px, margin-top 12px; linha "Arteiro · MATERIAL" 13px #5C6B6E, material em 11px caps #155C33. Hover: título #1E7A43. Sem raio, sem sombra.
- Vazio: caixa `border: 2px dashed rgba(27,42,47,.3)`, padding 56px 24px, 18px/600, "Nenhuma peça encontrada. Tente outra palavra ou remova um filtro."
- Paginação existente permanece abaixo da grade.

**Faixa "Novos arteiros"** — margin-top 56px, fundo #155C33, texto #F6F3EC, padding 48px 32px 56px.
- Kicker "Novos arteiros" 11px caps #B5DCA1; h2 "Chegaram à vitrine" 40px/800; à direita link "Você também é arteiro? Cadastre-se →" 14px 800 #F6F3EC, border-bottom 2px #B5DCA1 → `/cadastro`.
- Grid 3 col, gap 16px. Card = `<Link>` fundo #F6F3EC (hover #FFFFFF), padding 24px, coluna gap 12px: avatar 56px quadrado (logotipo ou iniciais em #1B2A2F com texto #B5DCA1 18px/800) + nome 19px/600 + meta "grupo · N peças" 13px #5C6B6E; bio 14px/1.5 #3B474B, 3 linhas (line-clamp); tags de materiais (até 3) 11px caps 600, padding 3px 8px, fundo #B5DCA1, texto #0F4225, `margin-top:auto`.
- Mostra os 3 arteiros mais recentes (hoje `ARTEIROS_RECENTES = 6`; reduzir para 3 ou manter 6 em 2 linhas).

**Footer** — padding 20px 32px 28px, 12px #5C6B6E: "© 2026 Arteiros Caraguá" à esquerda; "Política de privacidade" e "Termos de uso" à direita.

### 1b mobile (<640px)
- Header 52px, fundo #F6F3EC, border-bottom 2px #1B2A2F (claro no mobile), marca 22px quadrado #1E7A43 + nome 16px/800; à direita ícones Lucide `user` e `menu` em botões 44×44 (menu abre Peças / Arteiros / Entrar / Tornar-se arteiro). *Se preferir consistência, use o mesmo verde #155C33 do desktop com ícones #F6F3EC.*
- Busca abaixo do header: padding 12px 16px 0, input 44px, sem borda, border-bottom 2px rgba(27,42,47,.4).
- Chips de material em linha com scroll horizontal (padding 14px 16px 4px, gap 6px): "Todos" + materiais; chip 34px, padding 0 12px, border 2px #1B2A2F, 13px 600; selecionado = fundo #1B2A2F texto #F6F3EC.
- Linha: select "Todos os arteiros" (40px, flex 1, border 2px) + contador 12px #5C6B6E. Sem top 5 no mobile.
- Régua 2px #1B2A2F, margin 16px.
- Grade 2 col, gap 20px 12px; card igual ao desktop com nome/valor 14px e meta 12px em uma linha truncada "Arteiro · Material".
- Faixa verde: padding 28px 16px 32px; cards empilhados (gap 8px), padding 14px, avatar 48px, bio 2 linhas; link cadastre-se no fim.
- Alvos de toque ≥ 44px.

## Interações
- Filtros → query string (`busca`, `material`, `arteiro`), `router.replace` com `scroll:false` (padrão atual). Clicar em item já selecionado desmarca.
- Hover: superfícies → #FFFFFF ou #EAF6EE; texto → #1E7A43; botão claro → #CFEBD8; botão primário #1E7A43 → #155C33. Transição 150ms.
- Focus visível: `outline: 2px solid #1E7A43; outline-offset: 2px` (nunca o azul padrão).
- Sem animação de zoom nas fotos.

## Estado
`busca`, `materialId`, `arteiroId`, `pagina` (URL); `isPending` para o contador. Dados: `/api/publico/pecas`, `/api/publico/filtros` (materiais com contagem — adicionar `totalPecas` por material se não houver), `/api/publico/arteiros?limit=3` (recentes) e top 5 por peças.

## Assets
- Logotipo: vem da configuração do site (admin). No protótipo é um quadrado.
- Ícones: Lucide (`search`, `user`, `menu`, `arrow-right`).
- Fonte: Archivo (Google Fonts) 400/500/600/800.

## Arquivos
- `Arteiros Caraguá.dc.html` — protótipo (abrir no navegador; seção `#1b` é a direção escolhida; `#1a` foi descartada).
- `tokens/arteiros-tokens.css`, `tokens/tailwind.tokens.ts` — tokens.
