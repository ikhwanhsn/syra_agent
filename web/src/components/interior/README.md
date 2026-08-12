# interior.dev overlays (Syra)

Copied from [interior.dev](https://www.interior.dev) and re-tokenized for Syra.

## Token mapping

Syra is dark-by-default with a `.light` variant. Do not keep interior's `stone-*` / `#1D1D1A` / `dark:` pairs as-is.

| Interior (as shipped) | Syra |
| --- | --- |
| `bg-white dark:bg-[#1D1D1A]` | `bg-popover` or `bg-card` |
| `text-stone-700 dark:text-stone-200` | `text-foreground` |
| `text-stone-500` / `text-stone-400` | `text-muted-foreground` |
| `border-stone-200 dark:border-white/[0.16]` | `border-border` |
| Scrim `bg-stone-900/40 dark:bg-black/65` | `bg-black/70` or `bg-background/80` |
| Focus `#4568FF` / `#93B0FF` | `ring-ring` / `focus-visible:ring-2 focus-visible:ring-ring` |
| Raw `rounded-[14px]` | Prefer `rounded-lg` / `rounded-md` |

## Stack notes

- Import from `motion/react` (package: `motion`).
- Vite app: `"use client"` is a no-op; keep it for fidelity to upstream.
- No em dash (U+2014) in any file under `web/`.
- Action menus stay on Radix `DropdownMenu`. Interior `Dropdown` replaces value-picker `Select` only.
