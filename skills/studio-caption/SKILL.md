---
name: studio-caption
description: Write and lint the Instagram caption for a finished script or video. Use for "write the caption", "caption this", "hashtags".
---

# studio-caption

1. Load brand + voice. The first 125 characters must work alone (that is all the feed shows before "... more").
2. Structure: hook line, one or two body lines, one action (link/WhatsApp/keyword from the voice file), 3-5 hashtags max, at most one emoji unless the voice file says otherwise.
3. Save to `posts/<brand>-<date>-<slug>.md`, then run
   `python3 scripts/lint_caption.py <file> --brand brands/<brand>/brand.json`
   and fix every PROBLEM line before showing it.
4. Show the user the final text plus the "visible before more" preview. Mark Kurdish as draft for native review.
