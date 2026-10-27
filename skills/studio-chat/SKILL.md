---
name: studio-chat
description: Chat with and search the content of a link the user gives, such as a public post, page, video or article, for a social-management question. Use for "chat about this link", "search the contents of <link>", "what does this post say", "find X in this page", "summarise this post for <brand>".
---

# studio-chat

Answers questions about one or more links the user provides, and saves what it found so the user can search it again later.

**Rules.** Same as `studio-research`: public sources only. Never use the user's logged-in accounts, never run `agent-reach login`, never enable the experimental facebook, instagram or twitter channels, never bypass anti-bot protection, never ask for passwords. Quote only what the source actually says; never invent post text, numbers, comments or dates.

**Steps.**
1. **Brand.** Load `brands/<brand>/brand.json` and `brands/<brand>/voice.md` if the question is about a brand's content. Skip this for a plain content question.
2. **Read the link.** Try `agent-reach read <url>` first, then the built-in web fetch. Keep the title, author, date, the visible text and any transcript or subtitles.
3. **Check it worked.** If the result is only a title, a login wall or an empty shell (common for Facebook share links), say so and stop that source. Ask the user to paste the post text, the caption, or a screenshot. Do not guess the contents.
4. **Answer the question.** Use only the text you have. Cite each claim with the link and the quoted line. If the answer is not in the text, say "not in the source".
5. **Save.** Write the source and the answer to `research/<brand-or-general>-<topic>-<date>.md` (the folder is gitignored, so it stays private). Add a `## Searchable notes` section with short quotes and the link, so the next question can search that file instead of re-reading the link.

**Searching later.** For a follow-up question about a saved link, search `research/*.md` first and only re-read the link if the saved notes do not answer it.

**Output.** The answer, the source link, what was quoted, and what could not be read. Keep Kurdish or Arabic lines marked "draft, needs native review".
