---
name: studio-transcribe
description: Transcribe and cut recorded speech (the user's own Kurdish/Arabic voice, talking-head clips, podcasts) with ai-media-editor, and make captions from the transcript. Use only when the user has recorded audio or video.
---

# studio-transcribe

The motion videos need none of this. Use it when the user records voice or footage.
- Tool: `~/studio-sources/.venv-ame/bin/ai-media-editor modes` lists the 8 workflows (audio cut, video cut, ad clip, explainer from audio...).
- Transcription uses faster-whisper, which is **not installed yet**. Before first use: `uv pip install --python ~/studio-sources/.venv-ame/bin/python faster-whisper` (downloads a model; ask the user first, it is a large download).
- Kurdish (Sorani) recognition quality is uncertain with Whisper. Test on a 30-second sample and show the user the transcript before building on it. Always have the user correct the text.
- Output captions as an SRT file and burn them in with ffmpeg or use them in a Remotion template.
