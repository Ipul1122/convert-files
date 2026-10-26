# DESIGN.md — Strict "Anti-AI Slop" UI/UX System

## 1. Design Philosophy: Industrial Utilitarian
This application is a precision desktop utility (inspired by Linear, Raycast, and Braun industrial hardware), **NOT** a generic AI SaaS landing page. Every pixel must serve file productivity and clarity.

### BANNED Visual Patterns ("Anti-AI Slop" Rules)
- **NO Gradients:** Zero `bg-gradient-to-*`, zero mesh backgrounds, zero glowing text gradients. Every surface must be a solid, flat color token.
- **NO Glassmorphism / Blur Blobs:** Zero floating neon circles, zero heavy `backdrop-blur` overlays.
- **NO Startup Clichés:** No rocket emojis, no sparkle/magic wand icons, no unnecessary hero banners or marketing copy inside the workspace.
- **NO Excessive Border Radius:** Do not use `rounded-2xl` or `rounded-3xl` for panels. Maximum radius is `6px` (`rounded-md`) for containers and `4px` (`rounded`) for buttons/badges.

---

## 2. Color Palette (Strict Solid Tokens)
We use a monochrome Zinc base with a single high-visibility **International Orange / Amber** functional accent.

| Role | Token Name | Hex Code | Tailwind Equivalent | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **App Background** | `surface-bg` | `#09090B` | `bg-zinc-950` | Main application canvas |
| **Panel / Sidebar** | `surface-panel` | `#121215` | `bg-zinc-900` | Toolbars, sidebars, history cards |
| **Elevated / Hover** | `surface-elevated` | `#18181B` | `bg-zinc-800/80` | File dropzone active state, table row hover |
| **Border Default** | `border-subtle` | `#27272A` | `border-zinc-800` | 1px solid structural dividers |
| **Border Active** | `border-focus` | `#52525B` | `border-zinc-600` | Selected file cards, focused inputs |
| **Text Primary** | `text-primary` | `#FAFAFA` | `text-zinc-50` | Headings, filenames, active labels |
| **Text Secondary** | `text-secondary` | `#A1A1AA` | `text-zinc-400` | Helper text, descriptions |
| **Text Muted** | `text-muted` | `#71717A` | `text-zinc-500` | Timestamps, byte sizes, disabled states |
| **Primary Accent** | `accent-solid` | `#EA580C` | `bg-orange-600` | Primary "Convert" CTA, active tool indicator |
| **Accent Hover** | `accent-hover` | `#C2410C` | `hover:bg-orange-700` | Primary button hover state |
| **Semantic Success**| `status-ok` | `#16A34A` | `text-green-600` | "100% Offline Ready" badge, completed state |
| **Semantic Danger** | `status-err` | `#DC2626` | `text-red-600` | Delete file, purge DB, corrupt PDF warning |

---

## 3. Typography Rules (Maximum 2 Font Families)
1. **UI & Body Font (`font-sans`):** System UI Stack (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`).
2. **Technical & Metadata Font (`font-mono`):** (`JetBrains Mono`, `Fira Code`, `Consolas`, `monospace`).
   - **Mandatory `font-mono` usage:** File sizes (`2.45 MB`), compression delta (`-64%`), page counts (`12 PGS`), dimensions (`1920x1080`), processing durations (`140ms`), and file extensions (`.PDF`, `.JPG`, `.PNG`, `.WEBP`).

### Type Scale (Tight & Compact)
- **Workspace Title:** `text-base font-semibold tracking-tight text-zinc-50` (16px)
- **Section Header:** `text-xs font-semibold uppercase tracking-wider text-zinc-400` (12px)
- **Body / Filename:** `text-sm font-medium text-zinc-200` (14px)
- **Technical Meta:** `text-xs font-mono text-zinc-400` (12px)

---

## 4. File Format Badge Tokens (Solid Flat Badges)
All file format badges in the queue table and Local Vault MUST use `font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border`:
- **`.PDF` Badge:** `bg-zinc-900 text-orange-500 border-orange-900/60`
- **`.WEBP` Badge:** `bg-zinc-900 text-emerald-400 border-emerald-900/60`
- **`.JPG` / `.PNG` Badge:** `bg-zinc-900 text-zinc-300 border-zinc-700`
- **`.ZIP` Badge:** `bg-zinc-900 text-amber-400 border-amber-900/60`

---

## 5. Layout & Component Architecture
- **3-Pane Desktop Structure (No Page Scrolling):**
  1. **Left Rail (`220px` fixed width):** App header with `icon.webp` (`24x24px` rounded), Tool switcher (`IMG/WEBP → PDF`, `PDF → IMG/WEBP`, `IMG ↔ WEBP`, `MERGE`, `SPLIT`), Local Vault storage meter at the bottom, and "Offline Mode: Active" indicator.
  2. **Center Canvas (`flex-1`):** High-contrast dashed dropzone (`border-2 border-dashed border-zinc-800`) when empty; switches to a dense grid/table of loaded files with thumbnail previews, format badges (`.WEBP`, `.PDF`), and page order controls when populated.
  3. **Right Inspector (`280px` fixed width):** Contextual conversion parameters (Target format selector: `PDF / JPG / PNG / WEBP`, DPI scale, WebP/JPG quality slider, page orientation) and the solid `#EA580C` **Execute Conversion** button pinned at the bottom.