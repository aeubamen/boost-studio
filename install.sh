#!/usr/bin/env bash
# Links the studio-* skills into ~/.claude/skills and checks the tools.
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.claude/skills"
for d in "$ROOT"/skills/studio-*; do
  name="$(basename "$d")"
  ln -sfn "$d" "$HOME/.claude/skills/$name" && echo "linked $name"
done
echo "--- tool check"
export PATH="$HOME/.local/bin:$PATH"
chk() { if command -v "$1" >/dev/null 2>&1; then echo "ok   $1"; else echo "MISSING $1  ($2)"; fi; }
chk node "needed for Remotion (v22+)"
chk ffmpeg "brew install ffmpeg"
chk uv "https://docs.astral.sh/uv/"
chk agent-reach "uv tool install <path to Agent-Reach clone>"
[ -x "$HOME/studio-sources/.venv-ame/bin/ai-media-editor" ] && echo "ok   ai-media-editor" || echo "MISSING ai-media-editor (optional, see skills/studio-transcribe)"
claude mcp list 2>/dev/null | grep -qi postzen && echo "ok   postzen MCP (still needs /mcp Authenticate)" || echo "MISSING postzen MCP (optional, only for scheduled mode)"
