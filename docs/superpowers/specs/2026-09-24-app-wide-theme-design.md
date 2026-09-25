# App-wide dark/light theme — Design Spec

Date: 2026-09-24
Status: Approved for planning

## 1. Background

PixelForge already has a working dark/light theme system, documented in
`docs/design/visual-style.md`:

- `src/lib/theme.tsx` — `ThemeProvider` (mounted in `src/app/layout.tsx`),
  `useTheme()` hook, `data-theme="light"` on `<html>`, `localStorage`
  persistence, no-flash inline init script. Dark is the default (absence of
  the attribute).
- `src/app/globals.css` — `.pf-surface` class defining CSS custom properties
  (`--pf-bg`, `--pf-bg-raised`, `--pf-fg`, `--pf-fg-strong`, `--pf-fg-muted`,
  `--pf-fg-faint`, `--pf-border`, `--pf-border-strong`, `--pf-accent`,
  `--pf-danger-*`, `--pf-code-bg`, `--pf-code-fg`), overridden for light mode
  under `[data-theme="light"] .pf-surface`.
- `src/components/ui/Slider.tsx` — themed range input (`.pf-slider`), reacts
  to the tokens automatically.

This pattern is implemented on exactly 3 of 17 pages (`compress`,
`image-fft`, `aliasing`). Each of those pages independently imports
`useTheme()` and renders its own toggle button. Every other page, plus the
shared `Header` and `Footer`, is hardcoded to dark styling and does not
respond to the toggle at all — because there is no toggle available outside
those 3 pages.

**Goal of this project:** every page, plus `Header` and `Footer`, responds to
the same dark/light toggle. Dark remains the default. This is the
"Estender o toggle existente app-wide" option the user chose, confirmed over
"tema branco fixo" (replace dark entirely) and "só mudar o padrão inicial"
(keep scope as-is, just flip the default).

## 2. Survey of current state

(Full detail gathered via subagent survey; summarized here.)

| Area | Approx. lines | Complexity | Canvas/WebGL content colors present? |
|---|---|---|---|
| `Header.tsx` / `Footer.tsx` | 167 / 89 | Simple chrome | No |
| Home (`page.tsx` + `HeroSection`, `ModulesSection`, `ModuleGrid`, `PricingCard`) | ~430 | Simple, embeds 3D hero | Yes, inside `HeroLogo3D` / `HeroVoxelSphere` (scene only) |
| `pricing`, `cookies`, `privacy`, `infos` (+ `InfosSidebar`) | ~480 | Simple content pages | No |
| `canvas-3d/` (app + components) | ~2,812 + `canvas3d.css` (218) | Complex 3D workspace | Yes (scene); CSS file is pure UI chrome |
| `canvas-2d/` (app + components) | ~5,931 | Complex 2D vector editor | Yes (`EditorCanvas`, `ColorPicker` drawing); panels/toolbar are chrome |
| `logic-gates/` (app + components) | ~3,392 + `logic-gates.css` (42) | Complex ReactFlow node editor | No canvas; ReactFlow-generated DOM needs plain CSS overrides |
| `cube/` | ~399 | Complex 3D workspace | Yes (scene), otherwise thin wrapper |
| `otimizacao-linear/` | ~1,033 | Complex chart/controls, custom-drawn (not canvas/SVG lib) | Ambiguous — needs manual pass, see §6 |
| `vector/page.tsx` | 483 | Complex, single file, 1 canvas | Yes — some hex serve double duty as UI and draw color in the same file |
| `transform/page.tsx` | 93 | Simple (no canvas) | No |
| `canvas/page.tsx` | 57 | Simple wrapper (no canvas found) | No — verify during implementation |
| `segmentation/page.tsx` | 672 | Complex, multi-canvas | Yes — bright saturated hex are segmentation-class output colors; grayscale hex are UI |

**Cross-cutting finding:** two different hardcoded dark palettes already
coexist — a near-black family (`#0d0d0d`, `#111`, `#1a1a1a`, used in Header,
`vector`, `segmentation`) and a Tokyo-Night-style palette (`#1a1b26`,
`#2a2d3e`, `#c0caf5`, `#7dcfff`, used in `infos`, `pricing`, `canvas-3d`'s
CSS, the iro color picker). Both must converge on the single `--pf-*` token
set — see §5.

**No shared UI primitives** exist besides `Slider`. Every workspace
(canvas-2d's `ColorPicker`, canvas-3d's `IroColorPicker`, logic-gates'
`ContextMenu`, etc.) implements its own one-off controls with hardcoded
styling.

## 3. Scope boundary: UI chrome vs. content color

Canvas/WebGL pixel output represents algorithm results, not interface
styling, and is explicitly **out of scope**:

- 3D scene colors in `HeroLogo3D`, `HeroVoxelSphere`, `canvas-3d/`, `cube/`.
- Drawing/brush colors in `canvas-2d`'s `EditorCanvas`.
- Segmentation class colors in `segmentation/page.tsx` (the saturated
  `#ff0000`/`#00ff00`/etc. palette).
- FFT/image content fills in `image-fft` (already the case today).

Everything else — backgrounds, borders, panel/toolbar/sidebar chrome, text,
buttons, ReactFlow control DOM, color-picker chrome (not the color swatches
being picked) — is in scope.

Three files need a **manual line-level split** during implementation because
UI and content colors are interleaved in the same file: `vector/page.tsx`,
`segmentation/page.tsx`, and `otimizacao-linear`'s chart component (see §6).

## 4. Architecture changes

### 4.1 Centralize the toggle in `Header`

Today each of the 3 themed pages duplicates a toggle button. Move it to
`Header.tsx` once, rendered on every page. Delete the 3 per-page duplicates
in Phase 1 (see plan). `Header` and `Footer` become `.pf-surface` consumers
themselves.

### 4.2 Apply `.pf-surface` at the layout shell, not per-page

Currently `.pf-surface` is opt-in per page, which is why 14 pages never got
it — nothing forces new pages to opt in. Move the class up to wrap
`{children}` in `src/app/layout.tsx` (or a thin wrapper just inside `body`),
so every route inherits the token scope automatically. Individual pages then
only need to replace their own hardcoded colors with `var(--pf-*)` — they no
longer need to remember to add the class.

This is a one-line structural change but it's the one that actually
delivers "inteira" (whole app) instead of requiring perpetual per-page
opt-in discipline.

### 4.3 Reconcile the second ("Tokyo Night") palette

`infos`, `pricing`, `canvas-3d/canvas3d.css`, and the iro color picker use a
visually distinct dark palette. Per `docs/design/visual-style.md`'s existing
rule ("nunca hardcode hex, usar os tokens"), these converge onto the same
`--pf-*` tokens as everything else — there is one dark palette and one light
palette app-wide, not two. Where a Tokyo-Night hex has no obvious `--pf-*`
equivalent (e.g. the distinct blue accents `#7dcfff`/`#bb9af7`), map it to
`--pf-accent` or introduce it as a new token only if genuinely needed for a
semantic distinction (e.g. a second accent) — prefer reuse over adding
tokens.

### 4.4 New primitives only where a real gap exists

Don't build a component library speculatively. If a workspace's one-off
control (e.g. logic-gates' `ContextMenu`) is only used there, restyle it in
place with `var(--pf-*)` rather than extracting a shared component. Only
extract a shared primitive if the same control is duplicated verbatim across
≥2 workspaces (to be confirmed per-area during implementation, not decided
speculatively here).

### 4.5 `logic-gates.css` and `canvas3d.css`

These target library-generated DOM (ReactFlow, the iro picker) that Tailwind
utility classes can't reach. They stay as plain CSS files but their
hardcoded hex values switch to `var(--pf-*)` (custom properties work fine in
plain CSS, no Tailwind needed) plus a `[data-theme="light"]` override block
following the same pattern as `.pf-surface`'s light overrides.

## 5. Token usage rules (inherited from `docs/design/visual-style.md`, unchanged)

- Never hardcode hex for UI chrome — always `var(--pf-*)`.
- Light palette never uses pure white/black — warm, broken tones only
  (already defined: bg `#f4f2ee`, fg `#211f1a`, etc.).
- `font-sans` (Inter) everywhere; remove any custom `@import` fonts /
  `font-['...']` classes found in older pages (`infos`, `pricing`, `cookies`,
  `privacy` likely candidates — verify during implementation).
- Replace raw `<input type="range">` with `<Slider />` wherever found.

## 6. Areas needing a manual pass before/during implementation

- **`otimizacao-linear`**: 64 distinct hex, no canvas/SVG library detected —
  likely a custom div/inline-style chart. High risk that "chart data colors"
  and "UI chrome colors" are the same hardcoded values. Needs a dedicated
  read-through to classify each color before converting.
- **`vector/page.tsx`** and **`segmentation/page.tsx`**: canvas UI chrome
  (backgrounds, cursors, grid) and canvas draw/content colors coexist in the
  same file. Convert only the chrome; leave saturated/semantic content
  colors (segmentation classes, draw colors) untouched.
- **`canvas/page.tsx`**: survey found no `<canvas>` element despite the
  route name — confirm what it actually renders before assuming it's a
  simple page.

## 7. Testing approach

No automated visual regression tooling exists in this repo (Playwright is
configured for other tests per `package.json`, not visual snapshots). Given
that, verification is manual per the existing checklist in
`docs/design/visual-style.md` §6, step 5: run each page in both themes via
`pnpm dev`, toggle, and check contrast/legibility — especially anywhere a
danger/destructive action used a fixed color. The implementation plan should
sequence work so each phase ends in a state where `pnpm dev` + manual toggle
check is possible, rather than batching all 17 pages before any visual
check.

## 8. Out of scope

- Recoloring canvas/WebGL pixel content (see §3).
- Adding a system-preference (`prefers-color-scheme`) auto-detect — current
  behavior (default dark, explicit opt-in to light, persisted) is unchanged;
  not requested.
- Building a general-purpose component library beyond what's needed to
  unblock this theming pass (see §4.4).
- Non-visual accessibility work beyond what the existing focus-visible /
  contrast rules already cover.

## 9. Suggested phase breakdown (detail left to the implementation plan)

1. Shell: `Header` (add centralized toggle, remove per-page duplicates from
   `compress`/`image-fft`/`aliasing`), `Footer`, `layout.tsx` (`.pf-surface`
   at the root).
2. Simple content pages: home + its section components, `pricing`,
   `cookies`, `privacy`, `infos` + `InfosSidebar`, `transform`, `canvas`
   (pending verification of what it renders).
3. Palette reconciliation pass for the Tokyo-Night-style files identified in
   §4.3, done alongside phase 2 since `infos`/`pricing` are in that batch.
4. Complex workspaces, one area at a time, each finishing with a manual
   two-theme check: `logic-gates` (+ CSS), `canvas-3d` (+ CSS), `cube`,
   `canvas-2d`, `vector`, `segmentation`, `otimizacao-linear`.
