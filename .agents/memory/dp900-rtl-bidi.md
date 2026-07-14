---
name: DP-900 RTL Bidi number display
description: When Arabic text and numbers mix in a dir=rtl container, Unicode bidi reverses the visual order
---

## The Rule
In RTL containers, strings like `1 / 50` or `0 من 305` visually render reversed (`50 / 1`, `305 من 0`) because Arabic words pull the text direction RTL, swapping the number positions.

**Why:** Unicode Bidirectional Algorithm treats Arabic letters as RTL-strong. Numbers are weak and adopt the surrounding direction. The "/" and "من" act as direction anchors.

**How to apply:**
- Wrap fraction counters in `<span dir="ltr">`: `<span dir="ltr">{current} / {total}</span>`
- For stats like "0 من 305", either use `dir="ltr"` on the number part, or restructure to `${n} / ${total}` LTR, with Arabic label separately
- This applies to: Quiz header counter, Mistakes review counter, Flashcard counter, Home stat cards
