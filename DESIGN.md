# Design System: RNB Dashboard (Roads & Buildings Department, Government of Gujarat)

**Project ID:** Not linked to a Stitch project. This document is derived directly from the source code (`src/index.css` tokens and component stylesheets) and is the source of truth for new screens, including any future Stitch generation.

**Live site:** [newrbdashboard.netlify.app](https://newrbdashboard.netlify.app/)

---

## 1. Visual Theme & Atmosphere

The RNB Dashboard is a **calm, trustworthy, data-dense government analytics console**. It pairs an authoritative **deep navy chrome** (sidebar, login top bar, overlays) with **airy, near-white working surfaces** where the data lives. The mood is *institutional but modern*: never playful, never stark.

Key qualities:

- **Airy canvas, dense content.** Pages sit on a cool off-white background; cards pack many numbers, charts, and grids, but generous internal padding keeps them readable.
- **Frosted glass, lightly applied.** Cards are translucent white with a soft backdrop blur. Glass is a *finish*, not a gimmick: it is always subtle and always legible.
- **Accent-tinted, not accent-flooded.** Colour appears as thin rails, tinted header washes, pill chips, and icon badges. Large solid blocks of accent colour are reserved for primary buttons and the navy chrome.
- **Module colour is data.** Each module or group can carry its own accent (supplied by the API). Components expose a CSS variable (`--card-accent`, `--stat-accent`, `--group-accent`) so a single component style adapts to any module colour.
- **Gentle motion.** Cards lift a few pixels on hover, stat values scale slightly, and a glossy "shine sweep" crosses overview cards. Every motion respects `prefers-reduced-motion`.

---

## 2. Color Palette & Roles

### Brand chrome

| Name | Hex | Role |
| --- | --- | --- |
| Deep Institutional Navy | `#1a3a6e` (`--bg-sidebar`) | Sidebar background, login top bar tint, modal backdrops, carousel frame, gradient anchor for "department" moments. |
| Signal Sky Blue | `#7dd3fc` | Eyebrow text and icons *on navy* (top-bar eyebrow, sidebar group icons). |
| Bright Glacier Blue | `#38bdf8` | Active/outlined nav state on the dark sidebar. |

### Surfaces

| Name | Hex / value | Role |
| --- | --- | --- |
| Cool Mist Canvas | `#f8fafc` (`--bg-primary`) | Page background. |
| Soft Slate Wash | `#f1f5f9` (`--bg-secondary`) | Secondary panels, inset stat tiles, captcha tray, section bands. |
| Frosted White | `rgba(255,255,255,0.85)` (`--bg-card`) / `0.8` (`--glass-bg`) | Glass cards and inputs on tinted backgrounds. |
| Solid White | `#ffffff` (`--bg-card-hover`) | Hovered cards, modals, login card body. |

### Accents

| Name | Hex | Role |
| --- | --- | --- |
| Ocean Cerulean (primary) | `#0284c7` (`--accent-primary`) | Primary buttons, links, focus rings, active nav, header rails, current breadcrumb. |
| Cerulean Mist | `rgba(2,132,199,0.10)` (`--accent-primary-dim`) | Hover/active fills, focus halos, chip backgrounds. |
| Lagoon Teal (secondary) | `#0891b2` (`--accent-secondary`) | Second stop in accent gradients (rails), hovered links, "monthly" metrics. |
| Growth Emerald | `#059669` (`--accent-green`) | Positive/live states, "total users" metric, live pulse dot. |
| Harvest Amber | `#d97706` (`--accent-amber`) | Warning/"N" category, weekly metric. |
| Alert Crimson | `#dc2626` (`--accent-red`) | Errors, notification badge, the "Mother Login" call-out. |
| Royal Violet | `#7c3aed` (`--accent-purple`) | Occasional categorical accent. |

Each accent has a `-dim` variant (10–15% alpha) for backgrounds.

### Text

| Name | Hex | Role |
| --- | --- | --- |
| Midnight Ink | `#0f172a` (`--text-primary`) | Headlines, values, primary labels. |
| Slate Graphite | `#334155` (`--text-secondary`) | Field labels, nav items, body copy. |
| Muted Pewter | `#64748b` (`--text-muted`) | Subtitles, captions, placeholders, helper text. |

### Borders

| Name | Value | Role |
| --- | --- | --- |
| Hairline | `rgba(0,0,0,0.06)` (`--border-subtle`) | Default card and divider stroke. |
| Light Stroke | `rgba(0,0,0,0.12)` (`--border-light`) | Inputs, hovered cards, dashed QR frame. |
| Accent Stroke | `rgba(2,132,199,0.30)` (`--border-accent`) | Hovered inputs, pinned nav items. |

### Colour mixing convention

The codebase tints surfaces with `color-mix()` instead of adding new hex values:

- **Header wash:** `color-mix(in srgb, var(--accent) 9%, #fff)` fading to `rgba(255,255,255,0.94)`.
- **Card tint:** `color-mix(... accent 9%, #fff)` at 0% → white at ~42%, at a 155° angle.
- **Badge fill:** `color-mix(... accent 16%, #fff)` with a 24%-accent border.
- **Chip fill:** `color-mix(... accent 12%, #fff)` with a 28%-accent border.

### Chart palette

Charts use API-supplied colours first. Fallbacks live in `src/utils/chartApiColors.js`: coral `#FF6B6B`, turquoise `#4ECDC4`, sky `#45B7D1`, sage `#96CEB4`, butter `#FFEEAD`, dusty rose `#D4A5A5`, periwinkle `#9FA4C4`, lilac `#CC99FF`, and single-series blue `#2196f3`.

---

## 3. Typography Rules

- **Family:** **Inter** (300–800), falling back to the system UI stack. Antialiased rendering is on globally.
- **Casing:** **Title Case for all UI copy** (for example "Sign In To Dashboard" or "Total Visits (Daily)"). API-driven labels pass through `toTitleCase()` in `src/utils/displayText.js`. CSS `text-transform: uppercase` is **not** used; the one deliberate exception is the **"ROADS AND BUILDINGS DEPARTMENT" wordmark**, which is set in capitals as an official identifier.
- **Hierarchy:**
  - *Section titles* (landing sections): 1.35–1.85rem, weight 800, tracking −0.02em.
  - *Card / widget titles*: 1.02rem (1.12rem in modals), weight 700, tracking −0.025em, line-height ~1.28.
  - *Large numbers*: 1.2–2rem, weight 800, `tabular-nums`, tracking −0.02em, line-height 1.
  - *Field labels*: 0.78rem, weight 600, Slate Graphite.
  - *Eyebrows / subtitles*: 0.68–0.72rem, weight 600–700, tracking 0.04–0.14em, Muted Pewter or Ocean Cerulean.
  - *Body / helper*: 0.84–0.95rem, weight 400–500, line-height 1.45–1.55.
- **Character:** Tight, confident headings; slightly open, small eyebrows; numbers always tabular so columns align.

---

## 4. Component Stylings

### Signature patterns (reuse these first)

1. **Accent rail.** A 4px vertical bar on the left edge of a card or header, with pill-rounded ends and a Cerulean → Lagoon Teal gradient (or the module accent). On hover it widens to 5px and gains a soft glow. Used in widget headers, stat cards, and submodule overview cards.
2. **Tinted header band.** The top of a widget has a vertical wash from 9% accent-tinted white to near-white, separated from the body by a hairline tinted 10% towards the accent.
3. **Icon badge.** A 38–52px square with **generously rounded corners (11–12px)**, filled with 16%-accent white, a 24%-accent border, and a whisper-soft accent shadow. It holds a lucide icon or a small logo.
4. **Pill chip.** A fully rounded capsule (`999px`) for counts, current breadcrumb, and category badges, using a dim accent fill and an accent-coloured label.
5. **Shine sweep.** A diagonal glossy highlight that sweeps across overview cards on hover (`OverviewCardShine.css`). Use it only on clickable showcase cards.

### Buttons

- **Primary:** Solid Ocean Cerulean, white label, weight 600–700, **subtly rounded corners (8px)**, padding ~12–14px, `--shadow-glow` beneath. On hover it shifts 12% towards navy (`color-mix(accent 88%, navy)`) and lifts 1px. When disabled it drops to 65–70% opacity with a `wait` cursor.
- **Ghost / secondary:** White or frosted fill, light stroke, accent-coloured icon or label. On hover it takes a Cerulean Mist fill and a glow shadow.
- **Icon buttons:** 36–40px squares with 8px corners, frosted fill, accent icon, and an 18–20% accent border.
- **Danger call-out:** Red vertical gradient (`#ef4444` → `#dc2626`) with a warm red glow. It is reserved for "Mother Login".

### Cards and containers

- **Glass card (`.glass-card`):** Frosted white (`0.8` alpha, 16px blur), hairline border, **softly rounded corners (16px)**, and a whisper-soft diffused shadow (`0 4px 20px rgba(0,0,0,0.04)`). On hover the border darkens, a Cerulean glow shadow appears, and the card lifts 2px.
- **Module cards:** Glass card + accent rail + a 155° accent-tinted gradient + a text-only header (title and count pill, no icon) + an inset grid of static stat tiles.
- **Stat card:** Near-white tile with a left accent rail, an accent-coloured label (13px, 600), and a large tabular value. Hover lifts it 4px with an accent-coloured shadow.
- **Modals:** Solid white, 10–16px corners, `0 16px 48px rgba(0,0,0,0.18)`, over a navy- or ink-tinted blurred backdrop.

### Inputs and forms

- White fill, **Light Stroke** border, 8px corners, 11–12px vertical padding, and 0.95rem text.
- Hover changes the border to Accent Stroke.
- Focus uses a Cerulean border plus a **3px Cerulean Mist halo**. No browser outline is shown.
- Labels sit above fields in Slate Graphite at 0.78rem, weight 600.
- Inline tools (password eye, captcha refresh) are transparent icon buttons that turn Cerulean on hover over a Cerulean Mist fill.

### Navigation

- **Sidebar:** Deep navy (dark theme by default via `html.sidebar-dark`), 270px expanded and 76px collapsed. Groups can be solid module-colour blocks. Leaves are light text that brightens on hover. The active leaf gets a 2–3px glacier-blue indicator.
- **Page header:** Near-white bar with a faint 135° accent wash and a centred hairline gradient underline. The department emblem and name sit left, followed by breadcrumbs (bold parent › pill-styled current page).

### Iconography

[lucide-react](https://lucide.dev/) icons at a 2–2.25 stroke. Sizes are 18px inline, 20–22px in badges and nav, and 28px for hero/tagline icons. Icons inherit the accent colour of their context.

---

## 5. Layout Principles

- **Shell:** A fixed sidebar (270/76px) and a main column with a compact sticky header (~46px, 5px vertical padding). Every header control (menu toggle, Mother Login button, date pill, icon buttons, user button) is exactly **32px tall** so they line up on one baseline. The main content area has 16–20px padding (12–14px on mobile).
- **Grids:** `grid-2` and `grid-4` with 20px gaps. They collapse to 2 columns below 1200px and to 1 column below 768px. On the Dashboard Overview, module cards **stretch to fill the row** (`auto-fit`): 4 modules share the full width in 4 columns, and 6 or more wrap at **6 per row** (minimum 220px wide, fewer columns on narrower screens). Cards in a row stretch to equal height (no fixed minimum). Overview spacing is deliberately tight (14px between groups, 10px grid gaps, 10–14px card padding) so more rows fit on the first screen. The compact status tiles inside each card use **3 columns on wide cards and 2 on narrow ones** (minimum tile width 96px). **Important Links** uses a **3-column** grid (2 below 1100px, 1 below 640px).
- **Rhythm:** Spacing steps in roughly 4px increments (4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28px). Card internal padding is 14–22px, and gaps between stacked cards are 12–20px.
- **Radius scale:** 8px (`--radius-sm`, inputs and buttons), 12px (`--radius-md`, tiles and badges), 16px (`--radius-lg`, cards and panels), 20px (`--radius-xl`, hero media), and 999px for pills.
- **Elevation scale:**
  - *Resting:* whisper-soft (`--shadow-card`).
  - *Interactive:* Cerulean glow (`--shadow-glow`).
  - *Floating:* `--shadow-lg` (`0 10px 25px rgba(0,0,0,0.08)`).
  - *Over photography:* a deeper ink shadow (~`0 20px 48px rgba(15,23,42,0.18)`) so white cards separate from busy images.
- **Breakpoints in use:** 400, 640, 720, 768, 899/900, 960, 1100, 1200px.
- **Motion:** 150ms (fast), 250ms (base), and 400ms (slow) easings. Lifts use `cubic-bezier(0.22, 1, 0.36, 1)`. Entrance uses `fadeInUp` (20px, 0.5s). Always provide a `prefers-reduced-motion` fallback.

---

## 6. Screen Notes: Login

- **Structure:** A fixed frosted-navy top bar (emblem, eyebrow "Government Of Gujarat", title, "Download RNB Mobile App" ghost button). Below it is a full-height hero photo with a left-weighted navy gradient. On desktop the hero shows the **User Activity Count** glass card on the left and the **login card** on the right. Below the hero come the carousel ("Featured Works Across Gujarat") and the ecosystem flip cards ("Other R&B Applications").
- **Login card:** Follows the dashboard's *widget* pattern rather than inventing a new one. It has a white card, a tinted header band (no accent rail) with an icon badge holding the road logo, the department wordmark as the lead line (navy, 800 weight, single line), "Welcome Dashboard Login" as a smaller cerulean subtitle beneath it, then standard form fields, a solid Cerulean primary button, and centred text links separated by a hairline.
- **User Activity Count card:** A white glass card with an emerald live-pulse dot, the title, a muted subtitle, and a 2×2 grid of inset tiles labelled **Total Users**, **Total Visits (Daily)**, **Total Visits (Weekly)**, and **Total Visits (Monthly)**. Each tile has a coloured tabular value (emerald, cerulean, amber, teal).

---

## 7. Do / Don't

**Do**

- Reach for tokens (`var(--accent-primary)`, `var(--radius-md)`) and `color-mix()` tints before adding new hex values.
- Use the accent rail + tinted header + icon badge trio for any new card.
- Keep white cards over photography, with a deeper shadow for separation.
- Write all copy in Title Case, and pass API labels through `toTitleCase()`.

**Don't**

- Flood large areas with saturated accent colour, except for the navy chrome and primary buttons.
- Add CSS `text-transform: uppercase` (the department wordmark is the only exception).
- Introduce new font families, heavy drop shadows, or sharp 0px corners.
- Ship motion without a reduced-motion fallback.

---

## 8. Stitch Prompt Snippet

> Design a screen for the RNB Dashboard, a calm, institutional analytics console for Gujarat's Roads & Buildings Department. Use Inter. Chrome is Deep Institutional Navy (#1a3a6e); working surfaces are Cool Mist (#f8fafc) with frosted-white glass cards (16px corners, whisper-soft shadow). The primary accent is Ocean Cerulean (#0284c7), with Lagoon Teal (#0891b2), Growth Emerald (#059669), and Harvest Amber (#d97706) as supporting colours. Cards use a 4px cerulean-to-teal left accent rail, a faint accent-tinted header wash, and rounded icon badges. Buttons are solid cerulean with 8px corners and a soft blue glow. Inputs are white with a light grey stroke and a cerulean focus halo. All text is Title Case.
