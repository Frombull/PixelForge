# App-wide dark/light theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every page in PixelForge, plus the shared `Header` and `Footer`, responds to the existing dark/light theme toggle (currently only wired into `compress`, `image-fft`, `aliasing`).

**Architecture:** No new theming infrastructure is needed. `src/lib/theme.tsx` (`ThemeProvider`, `useTheme()`, `data-theme="light"` on `<html>`, localStorage persistence) and the `.pf-surface` CSS custom-property system in `src/app/globals.css` already work correctly on 3 pages. This plan mechanically extends the proven, documented pattern (`docs/design/visual-style.md`) to every remaining page and component, reconciles a second hardcoded "Tokyo Night" palette onto the same tokens, and moves `.pf-surface` up to the layout root plus centralizes the toggle button into the shared `Header` for the "site chrome" page family (home/pricing/cookies/privacy/infos), while each standalone "tool" page keeps its own local toggle button following the exact pattern `compress`/`image-fft`/`aliasing` already use.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS v4 (`@theme`, arbitrary-value utilities), plain CSS custom properties, `lucide-react` icons.

**Spec:** `docs/superpowers/specs/2026-09-24-app-wide-theme-design.md`

## Global Constraints

- Never hardcode hex/rgb color values for UI chrome — always use `var(--pf-*)` tokens (Tailwind arbitrary value syntax: `bg-[var(--pf-bg)]`, `text-[var(--pf-fg-muted)]`, `border-[var(--pf-border-strong)]`, etc.). Full token list and meaning: `docs/design/visual-style.md` §2.
- Dark is the default theme (absence of `data-theme` attribute). Never change this default.
- The light palette never uses pure white (`#fff`/`#ffffff`) or pure black (`#000`/`#000000`) anywhere — only the warm/broken tones already defined in `.pf-surface`'s `[data-theme="light"]` block in `src/app/globals.css`.
- Canvas/WebGL/3D **pixel content** colors (rendered scene geometry, drawing/brush colors, segmentation class colors, FFT image fills) are out of scope — do not touch colors passed to `ctx.fillStyle`, Three.js materials, or similar rendering APIs. Only UI chrome (backgrounds, borders, panels, toolbars, text, buttons) is in scope. See spec §3 and §6 for the specific files where this boundary needs a manual read before editing.
- Every page must end up wrapped in a `.pf-surface` (or inherit it from a parent that is) so it picks up the CSS variables. Confirm via browser inspector or by grepping the rendered root `className`.
- Replace any raw `<input type="range">` found while touching a file with the existing `<Slider />` component (`src/components/ui/Slider.tsx`, import as `import { Slider } from "@/components/ui/Slider";`), which already reacts to the theme via its `.pf-slider` CSS.
- Remove custom `@import` web fonts and `font-['...']` Tailwind classes encountered while touching a file; replace with `font-sans` (default, resolves to Inter) or `font-mono` (resolves to JetBrains Mono) — never both a custom import and the site font stack in the same file.
- Each task must end with `pnpm dev`, opening the affected route, and manually toggling the theme (click the toggle button, or run `localStorage.setItem('pf-theme','light')` then reload, for pages where the toggle isn't reachable yet) to confirm both themes render with readable contrast — especially any destructive/danger-colored button (`--pf-danger-*` tokens).
- Do not modify `/public/static-project/**` (the legacy static HTML/JS app embedded via iframe in `canvas` and `transform` pages) — it's outside this codebase's component system and out of scope.

## Review Focus

- **Toggle button reachable from every route, not just the 3 original pages** — the spec's whole point is "inteira" (entire app); a page that inherits `.pf-surface` tokens but has no way to actually switch theme is an incomplete deliverable, not a passing one. Verified per-task by locating a working toggle (shared `Header` for site pages, local header button for tool pages) and confirming `localStorage["pf-theme"]` flips when clicked.
- **Canvas/WebGL content color regressions** — the riskiest failure mode is a well-intentioned find-replace of a hex value that was actually feeding `ctx.fillStyle`/a Three.js material/a segmentation class color, silently breaking the tool's actual visual output (not just its chrome). `vector/page.tsx`, `segmentation/page.tsx`, `canvas-2d/EditorCanvas.tsx`/`ColorPicker.tsx`, `HeroLogo3D.tsx`, `HeroVoxelSphere.tsx`, `cube/CubeWorkspace.tsx`, and anything in `canvas-3d/` that touches WebGL materials need a manual read distinguishing "this color paints UI chrome" from "this color is rendered/algorithm output" before any replacement, per task.
- **Second hardcoded palette ("Tokyo Night": `#1a1b26`, `#2a2d3e`, `#c0caf5`, `#7dcfff`, `#bb9af7`) silently surviving in a file that looks done** — because two dark palettes already coexist in this codebase, a superficial pass could leave some Tokyo-Night hex values untouched (they still "look dark" so a quick visual check in dark mode alone won't catch it) while the near-black palette gets converted, defeating the point of unifying on one token set. Each task touching `infos`, `pricing`, `canvas-3d`, or the iro color picker greps for these specific hex strings after editing, not just for generic `#`.
- **Reused/shared components edited inconsistently across their call sites** — `PricingCard` is used by `pricing/page.tsx`; `InfosSidebar`/`InfosContentWrapper` are used by every route under `/infos/*` including MDX content pages. A task that themes the page but not the shared component it renders (or vice versa) leaves a page half-themed. Each task touching a page checks what shared components it imports and confirms those are covered by the same or an earlier task.
- **Local-header duplication drifting out of sync** — because tool pages don't share a `Header` component, the toggle-button JSX is duplicated per page (as it already is in `compress`/`image-fft`/`aliasing`). A task that copies the pattern with a typo'd token name (e.g. `--pf-fg-strong` vs `--pf-fg-strrong`) won't error at build time since these are arbitrary-value Tailwind classes — it'll just silently fail to theme that one element. Each task diffs its new header block against the working reference in `src/app/compress/page.tsx:256-289` rather than retyping from memory.

---

## File Structure

No new files are created except where noted (none are expected — this plan only modifies existing files). Files touched, grouped by task:

- `src/app/layout.tsx` — move `.pf-surface` to wrap `{children}` at the root.
- `src/components/Header.tsx` — add centralized theme toggle button, convert to tokens.
- `src/components/Footer.tsx` — convert to tokens.
- `src/app/page.tsx`, `src/components/HeroSection.tsx`, `src/components/ModulesSection.tsx`, `src/components/ModuleGrid.tsx`, `src/components/PricingCard.tsx` — convert chrome to tokens; scene colors in `HeroLogo3D.tsx`/`HeroVoxelSphere.tsx` untouched.
- `src/app/pricing/page.tsx`, `src/app/cookies/page.tsx`, `src/app/privacy/page.tsx` — convert to tokens.
- `src/app/infos/layout.tsx`, `src/components/InfosSidebar.tsx`, `src/components/InfosContentWrapper.tsx` — convert to tokens (MDX content pages need no direct edits).
- `src/app/not-found.tsx` — convert to tokens.
- `src/app/transform/page.tsx`, `src/app/canvas/page.tsx` — convert the thin loading/error/nav chrome to tokens (iframe interior out of scope).
- `src/app/compress/page.tsx`, `src/app/image-fft/page.tsx`, `src/app/aliasing/page.tsx` — remove now-duplicated toggle button, keep as local site pages already themed (only touched if Task 2 centralizes the toggle in a way that also benefits them — see Task 2 note).
- `src/app/vector/page.tsx` — convert chrome to tokens, apply `.pf-surface`, add toggle, swap range input for `<Slider />`.
- `src/app/segmentation/page.tsx` — same, preserving segmentation-class output colors.
- `src/app/otimizacao-linear/page.tsx`, `src/components/otimizacao-linear/LinearProgrammingChart.tsx`, `src/components/otimizacao-linear/LinearProgrammingControls.tsx` — convert chrome to tokens, remove custom font import.
- `src/components/logic-gates/LogicGatesEditor.tsx`, `src/components/logic-gates/logic-gates.css` — convert to tokens; CSS file gets a `[data-theme="light"]` override block.
- `src/components/cube/CubeWorkspace.tsx` — convert to tokens, add toggle.
- `src/components/canvas-3d/**/*.tsx`, `src/app/canvas-3d/canvas3d.css` — convert UI chrome to tokens (scene/material colors untouched); CSS file gets a light override block.
- `src/components/canvas-2d/**/*.tsx` (`PolygonEditor.tsx` and panel components — `Toolbar`, `Inspector`, `Menubar`, `BezierPanel`, `AnimationPanel`, `SettingsMenu`, `ZoomControls`, `ColorPicker` chrome only) — convert to tokens.

## Task Sequencing

Tasks 1–2 are a hard prerequisite for everything else (moving `.pf-surface` to the root and centralizing the toggle). Tasks 3–7 (site pages) and Tasks 8–14 (tool/workspace pages) are otherwise independent of each other and can be implemented/reviewed in any order after Task 2, though the numbering below follows the spec's phase order.

---

### Task 1: Move `.pf-surface` to the layout root

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: existing `ThemeProvider`, `themeInitScript` from `src/lib/theme.tsx` (already imported, unchanged).
- Produces: every route now renders inside an element carrying the `pf-surface` class, so `var(--pf-*)` resolves anywhere in the tree without each page needing its own `.pf-surface` wrapper. Later tasks rely on this — they only need to apply `var(--pf-*)` classes to their own elements, not re-add `.pf-surface`.

- [ ] **Step 1: Read the current body structure**

Current `src/app/layout.tsx` body:
```tsx
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
```

- [ ] **Step 2: Add `.pf-surface` to the body element**

```tsx
      <body className="pf-surface font-sans antialiased bg-[var(--pf-bg)] text-[var(--pf-fg)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
```

- [ ] **Step 3: Verify the dev server starts and the class is present**

Run: `pnpm dev`

Open `http://localhost:3000/` in a browser, inspect the `<body>` element, confirm it has `class="pf-surface font-sans antialiased bg-[var(--pf-bg)] text-[var(--pf-fg)]"`.

Expected: page still renders (colors may look unchanged since `page.tsx` still has its own hardcoded `bg-[#13141c]` on top, which Task 3 removes — that's fine, this step only verifies the wrapper exists and doesn't crash the app).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: apply pf-surface theme scope at the layout root"
```

---

### Task 2: Centralize theme toggle in `Header`

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `@/lib/theme` (returns `{ theme: "dark" | "light", toggleTheme: () => void }`).
- Produces: a toggle button rendered by every page that imports `Header` (home, privacy, pricing, cookies, infos routes, not-found). Tool pages (compress, image-fft, aliasing, vector, segmentation, etc.) do NOT import `Header` — they keep their own local toggle button, unchanged by this task.

- [ ] **Step 1: Add imports**

At the top of `src/components/Header.tsx`, add:
```tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
```

- [ ] **Step 2: Call the hook inside the component**

Inside `export default function Header() {`, alongside the existing `useState`/`usePathname` calls, add:
```tsx
  const { theme, toggleTheme } = useTheme();
```

- [ ] **Step 3: Render the toggle button in the desktop nav area**

Find the closing of the "Desktop Navigation" `<nav>` block (around line 123, `</nav>`). Immediately after it and before the "Mobile Menu Button" div, add:

```tsx
          {/* Theme toggle (desktop) */}
          <button
            onClick={toggleTheme}
            className="hidden lg:flex items-center justify-center w-8 h-8 shrink-0 text-neutral-400 hover:text-neutral-100 border border-[#2a2a2a] hover:border-sky-400/60 rounded transition-colors"
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
```

- [ ] **Step 4: Render the toggle button in the mobile menu**

Inside the mobile menu block (the `{mobileMenuOpen && (...)}` section, inside the `<nav>` that maps `[...PRIMARY_LINKS, ...SECONDARY_LINKS]`), add a toggle row after the mapped links, still inside the `<nav>`:

```tsx
              <button
                onClick={() => { toggleTheme(); closeMobileMenu(); }}
                className="group inline-flex items-center gap-2 px-4 py-3 text-neutral-300 uppercase tracking-[0.06em] text-[11px] transition-colors duration-100 hover:text-neutral-100"
              >
                {theme === "dark" ? <Sun size={13} strokeWidth={1.5} /> : <Moon size={13} strokeWidth={1.5} />}
                <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
              </button>
```

- [ ] **Step 5: Verify in the browser**

Run: `pnpm dev` (if not already running)

Open `http://localhost:3000/`, confirm the sun/moon icon button appears in the desktop nav, click it, confirm `localStorage.getItem("pf-theme")` (via devtools console) changes between `"dark"` and `"light"` and `<html data-theme="...">` updates. Resize to mobile width, open the hamburger menu, confirm the same toggle row appears and works.

Note: the page background itself won't visibly change yet — `page.tsx` still hardcodes `bg-[#13141c]`. That's expected; Task 3 fixes it. This step only verifies the toggle mechanism works.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: centralize theme toggle button in shared Header"
```

---

### Task 3: Theme `Footer`, home page, and its section components

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/HeroSection.tsx`
- Modify: `src/components/ModulesSection.tsx`
- Modify: `src/components/ModuleGrid.tsx`
- Modify: `src/components/PricingCard.tsx` (only its own styling — it's also used by Task 4's `pricing/page.tsx`)

**Interfaces:**
- Consumes: `.pf-surface` scope from Task 1 (root layout), toggle from Task 2 (`Header`, already rendered by `page.tsx`).
- Produces: nothing new consumed by later tasks, except `PricingCard` which Task 4 (`pricing/page.tsx`) renders as-is — confirm Task 4 doesn't need to re-touch it.

- [ ] **Step 1: Read each file's current hardcoded colors**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}\|bg-black\|bg-white\|text-white\|text-neutral-[0-9]\|border-neutral-[0-9]" src/app/page.tsx src/components/Footer.tsx src/components/HeroSection.tsx src/components/ModulesSection.tsx src/components/ModuleGrid.tsx src/components/PricingCard.tsx`

Note every match — these are the values Step 2 replaces. Do NOT touch any color literal that is passed as a prop into `HeroLogo3D` or `HeroVoxelSphere` (3D scene colors, out of scope) — only chrome around them (page background, text, section wrappers).

- [ ] **Step 2: Replace hardcoded colors with tokens**

Apply this mapping consistently across all 6 files (use the closest semantic match — don't invent new tokens):

| Hardcoded pattern found | Replace with |
|---|---|
| `bg-[#13141c]`, `bg-black`, near-black background | `bg-[var(--pf-bg)]` |
| `text-white`, pure white text | `text-[var(--pf-fg-strong)]` |
| `text-neutral-400`, `text-neutral-500` (secondary text) | `text-[var(--pf-fg-muted)]` |
| `text-neutral-600` (faint/meta text) | `text-[var(--pf-fg-faint)]` |
| `border-neutral-800`, `border-[#...]` dark borders | `border-[var(--pf-border)]` or `border-[var(--pf-border-strong)]` for interactive elements (buttons, cards) — match existing visual weight |
| `bg-[#0f1017]` (Footer background) | `bg-[var(--pf-bg-raised)]` |
| `bg-neutral-800`, `bg-neutral-700` (small filled dots/dividers in Footer) | `bg-[var(--pf-border-strong)]` |

Leave brand-accent colors that are intentionally NOT part of the dark/light system unchanged (e.g. `text-sky-400` used for the "3D" logo suffix, `hover:text-fuchsia-400`, `hover:text-green-400` module category colors in `Footer.tsx`) — these are brand/category accents, not theme chrome, and stay as Tailwind color classes in both themes.

- [ ] **Step 3: Remove the now-redundant `.pf-surface` requirement check**

None of these files need their own `.pf-surface` wrapper — Task 1 already applies it at `<body>`. Confirm no file in this task adds a duplicate `.pf-surface` class.

- [ ] **Step 4: Verify in the browser, both themes**

Run: `pnpm dev`

Open `http://localhost:3000/`, click the Header toggle from Task 2, confirm the page background, footer, hero section, and module cards all switch between dark and light and remain readable (check text contrast especially in the Footer's smallest text).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/Footer.tsx src/components/HeroSection.tsx src/components/ModulesSection.tsx src/components/ModuleGrid.tsx src/components/PricingCard.tsx
git commit -m "feat: theme home page, footer, and hero/module sections"
```

---

### Task 4: Theme `pricing`, `cookies`, `privacy` pages

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/cookies/page.tsx`
- Modify: `src/app/privacy/page.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1, `Header`/`Footer` toggle from Task 2, `PricingCard` from Task 3 (already themed — `pricing/page.tsx` just renders it, no changes needed there).

- [ ] **Step 1: Read each file's current hardcoded colors**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}\|bg-black\|bg-white\|text-white" src/app/pricing/page.tsx src/app/cookies/page.tsx src/app/privacy/page.tsx`

Note: `pricing/page.tsx` uses the Tokyo-Night palette (`#0f1017`, `#13141c`, `#2a2d3e`, `#a9b1d6`, `#c0caf5`); `cookies/page.tsx` and `privacy/page.tsx` use a different near-black palette (`#02060b`, `#09111a`, `#15263b`). Both converge onto the same `--pf-*` tokens — this is the palette reconciliation called out in the spec (§4.3).

- [ ] **Step 2: Replace hardcoded colors with tokens**

| Hardcoded pattern (either palette) | Replace with |
|---|---|
| `#13141c`, `#0f1017`, `#02060b`, `#09111a`, page/section backgrounds | `bg-[var(--pf-bg)]` |
| `#15263b`, `#2a2d3e`, elevated card/panel backgrounds | `bg-[var(--pf-bg-raised)]` |
| `#c0caf5`, `text-white`, primary text | `text-[var(--pf-fg-strong)]` |
| `#a9b1d6`, secondary/body text | `text-[var(--pf-fg-muted)]` |
| `border-[#2a2d3e]` and similar | `border-[var(--pf-border)]` |
| `bg-white` (used as a light-mode-only element in cookies/privacy, if present) | `bg-[var(--pf-fg-strong)]` if it's meant to invert with theme, otherwise leave as intentional fixed white only if it's e.g. inside a fixed-color illustration — verify by reading surrounding context before deciding |

- [ ] **Step 3: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/pricing`, `/cookies`, `/privacy`, toggle theme via Header on each, confirm readable contrast and that pricing cards (already themed in Task 3) look visually consistent with the now-themed page background around them.

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/page.tsx src/app/cookies/page.tsx src/app/privacy/page.tsx
git commit -m "feat: theme pricing, cookies, and privacy pages"
```

---

### Task 5: Theme `infos` layout, sidebar, content wrapper, and `not-found`

**Files:**
- Modify: `src/app/infos/layout.tsx`
- Modify: `src/components/InfosSidebar.tsx`
- Modify: `src/components/InfosContentWrapper.tsx`
- Modify: `src/app/not-found.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1, `Header`/`Footer` toggle from Task 2.
- Produces: every route under `/infos/*` (including the MDX files `src/app/infos/animations/page.mdx` and `src/app/infos/bezier-curves/page.mdx`, which have no hardcoded colors themselves and need no direct edits) inherits themed sidebar/content chrome automatically.

- [ ] **Step 1: Read current hardcoded colors**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}" src/app/infos/layout.tsx src/components/InfosSidebar.tsx src/components/InfosContentWrapper.tsx src/app/not-found.tsx`

This is the same Tokyo-Night palette as `pricing/page.tsx` (`#13141c`, `#a9b1d6`, `#2a2d3e`, plus `InfosSidebar`'s `#414868`, `#c0caf5`). `not-found.tsx` additionally has `#f7768e` (used for the "404" text and error message color) — this is a semantic danger/error accent, map it to `--pf-danger-fg`.

- [ ] **Step 2: Replace hardcoded colors with tokens**

Same mapping table as Task 4, plus:

| Hardcoded pattern | Replace with |
|---|---|
| `#f7768e` (404 digits, error text in `not-found.tsx`) | `text-[var(--pf-danger-fg)]` |
| `#414868` (`InfosSidebar` inactive/border state) | `border-[var(--pf-border-strong)]` or `text-[var(--pf-fg-faint)]` depending on usage — check whether it's applied to text or border in context |

In `InfosContentWrapper.tsx`, the inline `style={{ background: "rgba(20, 22, 31, 0.7)" }}` for article pages needs a token-based equivalent. Since CSS custom properties can be used in inline styles too, replace with:
```tsx
style={
  isArticle
    ? { background: "var(--pf-bg-raised)" }
    : undefined
}
```

- [ ] **Step 3: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/infos` (hub page), `/infos/animations`, `/infos/bezier-curves`, and a non-existent route (e.g. `/does-not-exist` to hit `not-found.tsx`). Toggle theme on each via the Header, confirm sidebar, content background tint (on article pages), and the 404 page all read correctly in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/app/infos/layout.tsx src/components/InfosSidebar.tsx src/components/InfosContentWrapper.tsx src/app/not-found.tsx
git commit -m "feat: theme infos hub/sidebar/content wrapper and not-found page"
```

---

### Task 6: Theme `transform` and `canvas` iframe wrapper chrome

**Files:**
- Modify: `src/app/transform/page.tsx`
- Modify: `src/app/canvas/page.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1. These pages do NOT import `Header`/`Footer` (they're full-bleed iframe embeds) — each needs its own local toggle button, following the same local-header pattern as the tool pages in Tasks 8+.
- Produces: nothing consumed elsewhere — these are leaf pages.

- [ ] **Step 1: Add theme imports and hook**

In both `src/app/transform/page.tsx` and `src/app/canvas/page.tsx`, add:
```tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
```

Inside each component function, add:
```tsx
  const { theme, toggleTheme } = useTheme();
```

- [ ] **Step 2: Convert the loading/error/nav chrome to tokens**

Both files share the same structure. Replace:
- `bg-black` (root div, loading overlay, error overlay) → `bg-[var(--pf-bg)]`
- `text-white`, `text-white/80` → `text-[var(--pf-fg-strong)]`, `text-[var(--pf-fg-muted)]`
- `border-white/20 border-t-white` (spinner) → `border-[var(--pf-border-strong)] border-t-[var(--pf-fg-strong)]`
- `bg-black/80 hover:bg-black/90 border-white/10` (bottom nav links) → `bg-[var(--pf-bg-raised)]/90 hover:bg-[var(--pf-bg-raised)] border-[var(--pf-border-strong)]`
- `text-white/90 hover:text-white` (nav link text) → `text-[var(--pf-fg-muted)] hover:text-[var(--pf-fg-strong)]`
- `text-red-400` (transform's error icon) — leave unchanged, it's a semantic error indicator matching `--pf-danger-fg` closely enough already; optionally swap to `text-[var(--pf-danger-fg)]` for consistency

Do not touch anything inside the `<iframe>` — its `src="/static-project/pages/index.html"` content is a separate static app, out of scope.

- [ ] **Step 3: Add a toggle button to the bottom nav row**

In both files, inside the `{/* Navigation Buttons - Bottom */}` div, add a toggle button alongside the existing `Link` elements:

```tsx
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 shrink-0 text-[var(--pf-fg-muted)] hover:text-[var(--pf-fg-strong)] rounded-xl bg-[var(--pf-bg-raised)]/90 hover:bg-[var(--pf-bg-raised)] backdrop-blur-md border border-[var(--pf-border-strong)] transition-all duration-300"
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </button>
```

- [ ] **Step 4: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/transform` and `/canvas`, confirm the loading spinner, bottom nav bar, and new toggle button render correctly and toggle between themes. The iframe content itself will remain unchanged (expected — out of scope).

- [ ] **Step 5: Commit**

```bash
git add src/app/transform/page.tsx src/app/canvas/page.tsx
git commit -m "feat: theme transform and canvas iframe wrapper chrome"
```

---

### Task 7: Verify and clean up the 3 already-themed pages against the new pattern

**Files:**
- Modify: `src/app/compress/page.tsx`
- Modify: `src/app/image-fft/page.tsx`
- Modify: `src/app/aliasing/page.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1 (now applied redundantly at both `<body>` and these pages' own root div — harmless, since Tailwind/CSS custom properties cascade, but confirm no visual regression).
- Produces: nothing new — this task is a consistency check, not new functionality.

- [ ] **Step 1: Confirm no regression from the root-level `.pf-surface` change**

Run: `pnpm dev`

Open `/compress`, `/image-fft`, `/aliasing`. Since Task 1 added `.pf-surface` to `<body>` and these pages already have their own `.pf-surface` div nested inside, confirm this nesting doesn't break anything (it shouldn't — `.pf-surface` just (re)declares the same custom properties, which is idempotent).

- [ ] **Step 2: Decide whether to remove the now-redundant `.pf-surface` class from these 3 pages**

Leave the pages' own `.pf-surface` div wrapper in place — do not remove it. These pages already work correctly today, removing their explicit wrapper adds risk (relying on `<body>` cascade for a page that has its own full-bleed layout) for no benefit. This step is a no-op by design; do not edit these 3 files' `.pf-surface` usage.

- [ ] **Step 3: Confirm these pages are excluded from Task 2's Header changes**

These pages don't import `src/components/Header.tsx` (confirmed during planning — they render their own local header). No action needed; this step is a verification only.

- [ ] **Step 4: No commit needed for this task**

This task is verification-only and makes no file changes. If Step 1 surfaces an actual regression, fix it, commit with message `fix: resolve pf-surface nesting regression in already-themed pages`, and note what broke. Otherwise, skip to Task 8.

---

### Task 8: Theme `vector` page

**Files:**
- Modify: `src/app/vector/page.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1. Has its own local header (no shared `Header`/`Footer`) — needs its own toggle button, `useTheme()` import.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Read the file fully and classify every color**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}\|ctx\.\(fillStyle\|strokeStyle\)\|getContext" src/app/vector/page.tsx`

This file has 1 `<canvas>` — classify each hex match as either (a) UI chrome (page background, header, panel borders, text) or (b) canvas drawing/content color (assigned to `ctx.fillStyle`/`ctx.strokeStyle` or passed into a draw function). Only convert (a). Leave (b) untouched.

- [ ] **Step 2: Add `.pf-surface`, theme imports, and convert UI chrome to tokens**

Add `.pf-surface` to the root div's className (alongside existing classes). Add:
```tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
```
and inside the component:
```tsx
  const { theme, toggleTheme } = useTheme();
```

Convert the local `<header>` (currently `border-b border-[#222]` and similar) to the same structure as `src/app/compress/page.tsx:256-289` — reuse that exact JSX shape (root div, header, `ArrowLeft` back link, title block, toggle button) with `vector`'s own title text, replacing every `#`-hex class with the matching `var(--pf-*)` token per the mapping table in Task 4, Step 2.

- [ ] **Step 3: Swap any raw range input for `<Slider />`**

Run: `grep -n 'type="range"' src/app/vector/page.tsx`

If found, replace with `import { Slider } from "@/components/ui/Slider";` and the component per `docs/design/visual-style.md` §4's usage example, preserving the existing `min`/`max`/`value`/`onChange` values.

- [ ] **Step 4: Verify in the browser, both themes, and confirm canvas drawing still works**

Run: `pnpm dev`

Open `/vector`, confirm the page chrome (header, panels, borders) switches between dark/light via the new toggle button, and confirm the actual vector-drawing canvas functionality (whatever `vector` demonstrates) still renders its content with unchanged colors — draw/interact with it to confirm no crash and no unintended color shift in the canvas output itself.

- [ ] **Step 5: Commit**

```bash
git add src/app/vector/page.tsx
git commit -m "feat: theme vector page chrome"
```

---

### Task 9: Theme `segmentation` page

**Files:**
- Modify: `src/app/segmentation/page.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1. Has its own local header — needs its own toggle button.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Read the file fully and classify every color**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}\|ctx\.\(fillStyle\|strokeStyle\)\|getContext" src/app/segmentation/page.tsx`

This file has 11 canvas/`getContext` call sites and 36 distinct hex values. The saturated colors (`#ff0000`, `#00ff00`, `#0000ff`, `#ffff00`, `#ff00ff`, `#00ffff`, `#800080`, `#ffa500`) are segmentation-class output colors — these are the actual algorithm result being visualized and must NOT change (a user comparing segmentation output before/after this change should see identical class colors). The grayscale/near-black hex values are UI chrome — those convert to tokens.

- [ ] **Step 2: Add `.pf-surface`, theme imports, and convert UI chrome to tokens**

Same approach as Task 8 Step 2: add `.pf-surface`, `useTheme()`, and rebuild the local `<header>` (currently `border-b border-[#222]`) against the `src/app/compress/page.tsx:256-289` reference pattern. Convert only the grayscale UI hex values identified in Step 1 to `var(--pf-*)` tokens per Task 4's mapping table; leave every saturated segmentation-class color untouched.

- [ ] **Step 3: Verify in the browser, both themes, and confirm segmentation output colors are unchanged**

Run: `pnpm dev`

Open `/segmentation`, run a segmentation, note the class colors shown. Toggle theme, confirm page chrome switches while the segmentation output's class colors remain pixel-identical to before the toggle (compare against a `git stash` / pre-change screenshot if in doubt).

- [ ] **Step 4: Commit**

```bash
git add src/app/segmentation/page.tsx
git commit -m "feat: theme segmentation page chrome, preserve class output colors"
```

---

### Task 10: Theme `otimizacao-linear` page and its two components

**Files:**
- Modify: `src/app/otimizacao-linear/page.tsx`
- Modify: `src/components/otimizacao-linear/LinearProgrammingChart.tsx`
- Modify: `src/components/otimizacao-linear/LinearProgrammingControls.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1. Has its own local header — needs its own toggle button.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Remove the custom font import**

In `src/app/otimizacao-linear/page.tsx`, delete the `FontImport` component definition and its `<FontImport />` usage:
```tsx
const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
  `}</style>
);
```
and the `<FontImport />` call inside the returned JSX. Replace every `font-['DM_Sans',sans-serif]` with `font-sans` and every `font-['IBM_Plex_Mono',monospace]` with `font-mono`.

- [ ] **Step 2: Read and classify colors in all 3 files**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}" src/app/otimizacao-linear/page.tsx src/components/otimizacao-linear/LinearProgrammingChart.tsx src/components/otimizacao-linear/LinearProgrammingControls.tsx`

This area has no `<canvas>`/WebGL — the chart is rendered via the `mafs` library (SVG-based), so all 64 hex values found in the survey are genuine UI/chart chrome, not algorithm pixel output. Classify by role: page background, header, panel borders → chrome tokens; chart line/point/fill colors (constraint lines, feasible region, optimal point marker) → these are semantically meaningful data-visualization colors (which constraint is which, which point is optimal), not theme chrome — leave `LinearProgrammingChart.tsx`'s actual plotted data colors unchanged unless they're clearly panel/axis/background chrome rather than data series colors. When in doubt within this file, prefer leaving a color unchanged over guessing.

- [ ] **Step 3: Convert UI chrome to tokens**

Add `.pf-surface`, `useTheme()`, `Moon`/`Sun` imports to `page.tsx`; rebuild its local `<header>` against the `src/app/compress/page.tsx:256-289` pattern. Convert chrome-classified colors in all 3 files per Task 4's mapping table (`#0d0d0d`/`#1a1a1a` → `--pf-bg`/`--pf-border`, `#e0e0e0`/`#f0f0f0` → `--pf-fg`/`--pf-fg-strong`, `#555`/`#444` → `--pf-fg-faint`, etc.).

- [ ] **Step 4: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/otimizacao-linear`, confirm page chrome and control panel switch themes via the new toggle, and confirm the chart itself (constraint lines, feasible region shading, optimal point) remains visually legible and functionally unchanged in both themes — the chart's data colors should look the same in dark and light mode since they weren't touched.

- [ ] **Step 5: Commit**

```bash
git add src/app/otimizacao-linear/page.tsx src/components/otimizacao-linear/LinearProgrammingChart.tsx src/components/otimizacao-linear/LinearProgrammingControls.tsx
git commit -m "feat: theme otimizacao-linear page, remove custom font import"
```

---

### Task 11: Theme `logic-gates` editor and its CSS overrides

**Files:**
- Modify: `src/components/logic-gates/LogicGatesEditor.tsx`
- Modify: `src/components/logic-gates/logic-gates.css`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1 (must be applied to `LogicGatesEditor`'s own root, since `src/app/logic-gates/page.tsx` is a thin dynamic-import wrapper with no chrome of its own).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Add `.pf-surface` and theme imports to the editor root**

`LogicGatesEditor.tsx`'s root element is currently `<div className="flex h-screen overflow-hidden bg-[#1e1e1e] font-mono text-white">` (around line 999). Add `pf-surface` to this className, add `useTheme()`/`Moon`/`Sun` imports, and locate wherever this component renders its own header/toolbar (if any exists — if not, add a small toggle button fixed in a corner, e.g. `absolute top-2 right-2 z-50`, styled per the Task 8 reference pattern).

- [ ] **Step 2: Convert component-level hardcoded colors to tokens**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}\|bg-\[#\|text-white\|text-neutral" src/components/logic-gates/LogicGatesEditor.tsx`

No `<canvas>` is used here (ReactFlow renders via SVG/DOM) — every match is UI chrome, convert per Task 4's mapping table.

- [ ] **Step 3: Add a light-mode override block to `logic-gates.css`**

This file styles ReactFlow-generated DOM that Tailwind can't reach. Current content hardcodes dark-only colors. Add a light override block using the same `[data-theme="light"]` attribute selector convention as `.pf-surface`:

```css
[data-theme="light"] .react-flow__controls button {
  background: var(--pf-bg-raised);
  border-bottom: 1px solid var(--pf-border);
  color: var(--pf-fg-muted);
  fill: var(--pf-fg-muted);
}
[data-theme="light"] .react-flow__controls button:hover {
  background: var(--pf-border);
  color: var(--pf-fg-strong);
  fill: var(--pf-fg-strong);
}
[data-theme="light"] .react-flow__node.selected > div,
[data-theme="light"] .react-flow__node.selected > button {
  box-shadow: 0 0 0 1px var(--pf-accent) !important;
}
[data-theme="light"] .react-flow__connection-path {
  stroke: var(--pf-accent);
}
```

Also convert the existing dark-mode rules' hardcoded hex (`#2c2c2c`, `#3a3a3a`, `#b0b0b0`, `#363636`, `#fff`, `#888`, `#aaa`) to `var(--pf-*)` equivalents so both the default (dark) and the new light block reference the same token system: `#2c2c2c`→`var(--pf-bg-raised)`, `#3a3a3a`→`var(--pf-border)`, `#b0b0b0`→`var(--pf-fg-muted)`, `#363636`→`var(--pf-border-strong)`, `#fff`→`var(--pf-fg-strong)`, `#888`/`#aaa`→`var(--pf-accent)`.

- [ ] **Step 4: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/logic-gates`, confirm the editor chrome, ReactFlow controls (zoom buttons), node selection outline, and connection line color all switch correctly between dark and light via the new toggle.

- [ ] **Step 5: Commit**

```bash
git add src/components/logic-gates/LogicGatesEditor.tsx src/components/logic-gates/logic-gates.css
git commit -m "feat: theme logic-gates editor and ReactFlow CSS overrides"
```

---

### Task 12: Theme `cube` workspace

**Files:**
- Modify: `src/components/cube/CubeWorkspace.tsx`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1 (applied to this component's own root, since `src/app/cube/page.tsx` is a thin wrapper).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Read and classify colors**

Run: `grep -n "#[0-9a-fA-F]\{3,8\}\|ctx\.\|getContext\|Material\|color=" src/components/cube/CubeWorkspace.tsx`

This file renders a 3D RGB color cube — colors feeding the 3D scene/geometry (the cube's own coloring, since the whole point of this tool is visualizing RGB space) are content, not chrome; leave those untouched. The local `<header>` (around line 314, `border-b border-[#2a2d3e]`) and surrounding panel chrome are UI, convert those.

- [ ] **Step 2: Add `.pf-surface`, theme imports, convert chrome to tokens**

Add `pf-surface` to the workspace's root className. Add `useTheme()`, `Moon`, `Sun` imports (alongside the existing `ArrowLeft`, `Box`, `House`, `Info` from `lucide-react`). Rebuild the local header's color classes against the Task 8 reference pattern, and add a toggle button in the header area following the same button markup used elsewhere.

- [ ] **Step 3: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/cube`, confirm the header/panel chrome switches themes via the toggle, and confirm the 3D RGB cube visualization itself is visually unchanged (still shows the full RGB color space, unaffected by the UI theme).

- [ ] **Step 4: Commit**

```bash
git add src/components/cube/CubeWorkspace.tsx
git commit -m "feat: theme cube workspace chrome"
```

---

### Task 13: Theme `canvas-3d` workspace and its CSS

**Files:**
- Modify: files under `src/components/canvas-3d/` that contain UI chrome (identify via Step 1 — likely a main workspace/sidebar/panel component plus `IroColorPicker.tsx`)
- Modify: `src/app/canvas-3d/canvas3d.css`

**Interfaces:**
- Consumes: `.pf-surface` from Task 1 (applied to the workspace's own root).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Identify all files with UI chrome under `src/components/canvas-3d/`**

Run: `find src/components/canvas-3d -name "*.tsx" | xargs grep -ln "#[0-9a-fA-F]\{3,8\}"`

For each file listed, run `grep -n "#[0-9a-fA-F]\{3,8\}\|ctx\.\|Material\|Mesh\|Color(" <file>` and classify: WebGL/Three.js scene/material colors are out of scope; sidebar, panel, button, slider-label chrome is in scope.

- [ ] **Step 2: Add `.pf-surface` to the workspace root, add theme imports and toggle**

Locate the top-level workspace component (likely `Canvas3DWorkspace.tsx` based on the import in `src/app/canvas-3d/page.tsx`). Add `pf-surface` to its root className, `useTheme()`/`Moon`/`Sun` imports, and a toggle button in its existing header/toolbar area (or a fixed-position button if no header exists, per the Task 11 Step 1 fallback pattern).

- [ ] **Step 3: Convert identified chrome files to tokens**

For each file/color identified as chrome in Step 1, convert per Task 4's mapping table. For `IroColorPicker.tsx` specifically, only convert the picker's own chrome (background, border, labels) — the color swatches/gradient the iro.js library renders to represent the selectable color space are library-internal and not theme chrome.

- [ ] **Step 4: Add a light override block to `canvas3d.css`**

This file styles the iro.js color picker's pseudo-elements and range slider thumbs, currently hardcoded to Tokyo-Night hex (`#11131a`, `#7dcfff`, `#1a1b26`, `#2a2d3e`, `#c0caf5`, etc.). Convert the existing rules' hex to `var(--pf-*)` equivalents (`#11131a`→`var(--pf-bg)`, `#7dcfff`→`var(--pf-accent)`, `#1a1b26`/`#2a2d3e`→`var(--pf-bg-raised)`/`var(--pf-border)`, `#c0caf5`/`#a9b1d6`→`var(--pf-fg-strong)`/`var(--pf-fg-muted)`) — since these are plain `var()` references (no attribute-selector needed), the existing dark-default rules automatically pick up the light values once `data-theme="light"` is set on `<html>`, because `--pf-*` are defined at the `.pf-surface` scope which now wraps the whole app (Task 1). No separate `[data-theme="light"]` block is needed in this file — the tokens already flip.

- [ ] **Step 5: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/canvas-3d`, confirm sidebar/panel chrome and the color picker's own chrome (not the color wheel/gradient itself) switch correctly between themes, and confirm the 3D scene rendering is unaffected.

- [ ] **Step 6: Commit**

```bash
git add src/components/canvas-3d src/app/canvas-3d/canvas3d.css
git commit -m "feat: theme canvas-3d workspace and iro color picker chrome"
```

---

### Task 14: Theme `canvas-2d` workspace (polygon editor)

**Files:**
- Modify: `src/components/canvas-2d/PolygonEditor.tsx`
- Modify: chrome-only portions of `src/components/canvas-2d/Toolbar.tsx`, `Inspector.tsx`, `Menubar.tsx`, `BezierPanel.tsx`, `AnimationPanel.tsx`, `SettingsMenu.tsx`, `ZoomControls.tsx`, `ColorPicker.tsx` (exact filenames per the survey — confirm via `ls src/components/canvas-2d/` at task start, since not all were individually read during planning)

**Interfaces:**
- Consumes: `.pf-surface` from Task 1 (applied to `PolygonEditor.tsx`'s root, since `src/app/canvas-2d/page.tsx` is a thin dynamic-import wrapper).
- Produces: nothing consumed elsewhere. This is the last task — no later task depends on it.

- [ ] **Step 1: List the actual component files and classify each**

Run: `ls src/components/canvas-2d/*.tsx src/components/canvas-2d/lib/*.ts 2>/dev/null`

For each `.tsx` file, run `grep -n "#[0-9a-fA-F]\{3,8\}\|getContext\|ctx\." <file>` to find hardcoded colors and canvas usage. `EditorCanvas.tsx` (or wherever the actual `<canvas>` drawing happens) contains draw/content colors — out of scope. Panel/toolbar/menu components (Toolbar, Inspector, Menubar, BezierPanel, AnimationPanel, SettingsMenu, ZoomControls) are chrome — in scope. `ColorPicker.tsx` is chrome for its own UI (background, border, layout) but its swatch/gradient rendering (if it draws to a canvas to show the color space) is content — same split as `IroColorPicker.tsx` in Task 13.

- [ ] **Step 2: Add `.pf-surface`, theme imports, and toggle to `PolygonEditor.tsx`**

Add `pf-surface` to the root className. Add `useTheme()`/`Moon`/`Sun` imports and a toggle button in the editor's toolbar/menubar area (most natural fit given `Menubar.tsx` exists — place it there if that component renders a persistent top bar, otherwise fall back to a fixed-position button per Task 11 Step 1's pattern).

- [ ] **Step 3: Convert each chrome file's colors to tokens**

For every file classified as chrome in Step 1, convert hardcoded hex/Tailwind dark classes to `var(--pf-*)` per Task 4's mapping table. Any raw `<input type="range">` found (per the Global Constraints' note that `AnimationPanel.tsx` and `BezierPanel.tsx` currently use raw range inputs) gets swapped for `<Slider />` from `@/components/ui/Slider`.

- [ ] **Step 4: Verify in the browser, both themes**

Run: `pnpm dev`

Open `/canvas-2d`, confirm all panels (toolbar, inspector, menubar, bezier panel, animation panel, settings menu, zoom controls, color picker chrome) switch between dark and light via the toggle, and confirm the actual polygon-drawing canvas content (shapes, vertices, bezier curves as drawn) is visually unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas-2d
git commit -m "feat: theme canvas-2d polygon editor and panel components"
```

---

## Final Verification

After all 14 tasks are complete:

- [ ] Run `pnpm build` from the repo root and confirm it completes without errors.
- [ ] Run through every route once more in both themes: `/`, `/pricing`, `/cookies`, `/privacy`, `/infos`, `/infos/animations`, `/infos/bezier-curves`, `/compress`, `/image-fft`, `/aliasing`, `/vector`, `/segmentation`, `/otimizacao-linear`, `/logic-gates`, `/cube`, `/canvas-3d`, `/canvas-2d`, `/transform`, `/canvas`, and a 404 route.
- [ ] Confirm `localStorage["pf-theme"]` persists across a full page reload and across navigating between routes (set light on one page, navigate to another, confirm it's still light).
- [ ] Grep the whole `src/` tree one more time for leftover Tokyo-Night hex values to confirm the palette reconciliation is complete: `grep -rn "#1a1b26\|#2a2d3e\|#c0caf5\|#7dcfff\|#bb9af7\|#a9b1d6" src/ --include="*.tsx" --include="*.css"` — any remaining hits should only be inside files explicitly marked out-of-scope (WebGL materials, canvas draw calls, segmentation class colors), not UI chrome.
