# RNB Dashboard — Design System (Dark Mode)

> Source of truth for the Roads & Buildings Department dashboard visual language.
> Stitch MCP was unavailable in this session; tokens below match `src/index.css`.

## Atmosphere

- **Mood:** Night operations console — calm, authoritative, civic.
- **Density:** 6/10 (balanced operational dashboard).
- **Motion:** Subtle only — theme crossfade (~200ms), card lift, no neon pulses.
- **Variance:** Symmetric, predictable layouts (government software).

## Color calibration (Dark) — `html[data-theme='dark']`

| Role | Token | Value |
|------|-------|-------|
| Canvas | `--bg-primary` | `#0b1220` |
| Secondary | `--bg-secondary` | `#111a2b` |
| Card glass | `--bg-card` | `rgba(17, 26, 43, 0.82)` |
| Card solid | `--bg-card-solid` | `#111a2b` |
| Elevated | `--bg-elevated` | `#131d30` |
| Sidebar deep | `--bg-sidebar-deep` | `#070d18` |
| Surface mix | `--surface-mix` | `#101a2c` |
| Text primary | `--text-primary` | `#e5eef8` |
| Text secondary | `--text-secondary` | `#b6c4d6` |
| Text muted | `--text-muted` | `#8a9bb0` |
| Accent | `--accent-primary` | `#38bdf8` |
| Success | `--accent-green` | `#34d399` |
| Danger | `--accent-red` | `#f87171` |
| Warning | `--accent-amber` | `#fbbf24` |
| Chart grid | `--chart-grid` | `rgba(255, 255, 255, 0.08)` |
| Chart axis | `--chart-axis` | `#8a9bb0` |
| Chart label | `--chart-label` | `#cbd8e8` |

### Banned

- Pure `#000` backgrounds
- Purple / indigo neon glows
- Warm cream + terracotta “AI default”
- High-saturation rainbow accents on chrome

## Light mode

Retain existing `:root` tokens. Dark mode only activates via `html[data-theme="dark"]`.

## Typography

- **UI:** Inter — weight 500–700 for chrome, 400 for body.

## Components

- **Cards:** Dark glass via `--bg-card` / `--surface-mix` gradients — no white fills.
- **Sidebar:** Deep navy under dark theme; grievance CTA uses muted tokens.
- **Header / Login:** Moon / sun toggle; preference in `localStorage` (`rnb_theme`).
- **Data grid:** Flat deep head (`#12233c`); cyan chrome accent.
- **Charts:** Recharts reads `--chart-*` and tooltip surfaces from elevated tokens.
- **Inputs / toasts:** Elevated fill, light border, sky focus ring.

## Theme behavior

- Persist `rnb_theme` = `light` | `dark` in `localStorage`.
- If unset, follow `prefers-color-scheme`.
- Apply before first paint (inline boot script in `index.html`) to avoid FOUC.
- Toggle in page header and login top bar.

## Motion

- Theme switch: `color` / `background` transition ~200ms on `html` / `body`.
- No perpetual glow animations on chrome.
