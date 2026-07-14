---
name: DP-900 Tailwind v4 custom utilities
description: Tailwind v4 doesn't include scrollbar-hide; must be added manually in @layer block
---

## The Rule
Tailwind CSS v4 removed many utility plugins and the `@apply` pattern for dark mode differs. Custom utilities must be added directly inside `@layer components` or `@layer utilities` blocks in `index.css`.

**Why:** v4 uses a new CSS-first architecture — the JIT scanner won't generate classes that don't exist in the theme or an explicit rule.

**How to apply:**
Add to the `@layer` block at the bottom of index.css:
```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
```
Do NOT use `@apply dark:` — the project uses `:root` CSS vars for always-dark theme.
