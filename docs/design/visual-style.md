# Visual Style — Dark/Light Theme Pattern

Padrão criado no endpoint `image-fft` (`src/app/image-fft/page.tsx`) para ser
replicado nos demais endpoints (`aliasing`, `compress`, `vector`,
`segmentation`, etc).

## 1. Tema (dark/light)

Infra global em `src/lib/theme.tsx`:

- `ThemeProvider` (já montado em `src/app/layout.tsx`, envolvendo todo o app)
- Hook `useTheme()` → `{ theme, toggleTheme }`
- Estado persistido em `localStorage("pf-theme")`
- Aplica o atributo `data-theme="light"` no `<html>` (dark é o padrão/ausência
  do atributo)
- Script inline no `<head>` (`themeInitScript`) evita flash de tema errado no
  primeiro paint

Para usar em uma página nova, basta:

```tsx
import { useTheme } from "@/lib/theme";

const { theme, toggleTheme } = useTheme();
```

E renderizar um botão de toggle (ver seção 4).

## 2. Tokens de cor (`.pf-surface`)

As cores **não** são aplicadas direto no `<html>`/`body` — são escopadas via
classe `.pf-surface` (definida em `src/app/globals.css`), assim cada página
opta explicitamente por usar o sistema de tema sem afetar páginas antigas
ainda não migradas.

Envolva o container raiz da página com `className="pf-surface ..."` e use as
variáveis CSS abaixo (nunca hardcode hex):

| Variável | Uso |
|---|---|
| `--pf-bg` | fundo principal da página |
| `--pf-bg-raised` | fundo de cards/canvas/inputs elevados |
| `--pf-fg` | texto padrão |
| `--pf-fg-strong` | títulos, texto de destaque |
| `--pf-fg-muted` | texto secundário (parágrafos, descrições) |
| `--pf-fg-faint` | labels, metadados, texto bem discreto |
| `--pf-border` | bordas sutis (divisores, cards) |
| `--pf-border-strong` | bordas de botões/inputs interativos |
| `--pf-accent` | cor de destaque (foco, slider, links ativos) |
| `--pf-danger-fg` / `--pf-danger-fg-hover` | texto de ações destrutivas |
| `--pf-danger-border` / `--pf-danger-bg` / `--pf-danger-border-hover` | botão destrutivo (ex: "Resetar") |
| `--pf-code-bg` / `--pf-code-fg` | trechos `<code>` inline |

Uso em Tailwind: `bg-[var(--pf-bg)]`, `text-[var(--pf-fg-muted)]`, etc.

### Paleta dark (padrão)

Fundo quase-preto (`#0d0d0d`), texto cinza-claro, bordas bem discretas
(`#1e1e1e`/`#222`). Igual ao visual técnico/terminal que o site já tinha.

### Paleta light

**Importante:** não usar branco puro (`#fff`) nem preto puro (`#000`) — fica
com cara de tema de alto contraste/acessibilidade forçada, não de light mode
normal. Usar tons quebrados e quentes:

- Fundo: `#f4f2ee` (bege/cinza claro, não branco)
- Texto: `#3a372f` (marrom-acinzentado escuro, não preto)
- Bordas: `#e4e0d8` / `#d6d0c4` (discretas, nunca cinza neutro puro)
- Accent: `#4d7ea8` (azul suave)

Se for preciso ajustar a paleta light de outro endpoint, replicar essa lógica
(tons quebrados/quentes, nunca preto/branco puros, bordas suaves).

## 3. Fonte

Tudo usa `font-sans`, que já resolve para **Inter** globalmente (configurado
em `src/app/layout.tsx` + `--font-sans` em `globals.css`). Endpoints antigos
que importam `DM_Sans`/`IBM_Plex_Mono` via `<style>` inline devem remover esse
import e trocar as classes `font-['...']` por `font-sans`.

Mono (`--font-jetbrains-mono` / `font-mono`) continua disponível para casos
que realmente pedem uma fonte monoespaçada (ex: blocos de código), mas os
labels uppercase/tracked que antes usavam IBM Plex Mono agora usam
`font-sans` mesmo — o tracking largo + uppercase já dá a estética técnica.

## 4. Slider

Componente `src/components/ui/Slider.tsx`. Substitui `<input type="range">`
cru:

```tsx
import { Slider } from "@/components/ui/Slider";

<Slider min={1} max={256} value={brushSize} onChange={setBrushSize} aria-label="Tamanho do pincel" className="w-32" />
```

Estilizado via classe `.pf-slider` em `globals.css`: track com preenchimento
proporcional ao valor (`--pf-slider-fill`), thumb grande (16px) com hover
(scale) e focus ring, tudo usando os tokens `--pf-accent`/`--pf-border-strong`
— já reage ao tema automaticamente.

## 5. Toggle de tema

Botão de ícone (sol/lua, `lucide-react`) no header da página:

```tsx
<button
  onClick={toggleTheme}
  className="flex items-center justify-center w-8 h-8 shrink-0 text-[var(--pf-fg-muted)] hover:text-[var(--pf-fg-strong)] border border-[var(--pf-border-strong)] hover:border-[var(--pf-accent)] rounded transition-colors"
  title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
  aria-label="Alternar tema"
>
  {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
</button>
```

## 6. Checklist para migrar um endpoint existente

1. Adicionar `pf-surface` na div raiz da página + trocar `bg-[#...]`/
   `text-[#...]` hardcoded pelos tokens `var(--pf-*)` equivalentes.
2. Remover `@import` de fontes custom e classes `font-['...']`; usar
   `font-sans` (e `font-mono` só onde fizer sentido).
3. Trocar `<input type="range">` pelo componente `<Slider />`.
4. Adicionar o botão de toggle de tema no header (`useTheme()`).
5. Rodar a página nos dois temas e conferir contraste/legibilidade,
   principalmente onde havia cores fixas de destaque (ex: botões de
   ação/perigo).
