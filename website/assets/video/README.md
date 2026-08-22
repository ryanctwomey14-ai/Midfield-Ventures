# Hero background video

Drop three files in place and the hero switches from gradient to video
automatically. No code change needed.

| File | Location | Spec |
| --- | --- | --- |
| `hero.mp4` | `assets/video/` | H.264, 2400×1400, 6–8s seamless loop, **no audio track**, target < 4 MB |
| `hero.webm` | `assets/video/` | VP9, same source, usually ~30% smaller — served first where supported |
| `hero-poster.jpg` | `assets/img/` | Frame 1 of the video, 2400×1400, WebP or JPG, quality ~80 |

Then delete the `.ph-note` placeholder paragraph inside `.hero-bg` in
`index.html`.

## Encoding

```bash
ffmpeg -i source.mov -an -t 8 -vf scale=2400:-2 -c:v libx264 -crf 26 -preset slow -movflags +faststart assets/video/hero.mp4
ffmpeg -i source.mov -an -t 8 -vf scale=2400:-2 -c:v libvpx-vp9 -crf 34 -b:v 0 assets/video/hero.webm
ffmpeg -i source.mov -vframes 1 -q:v 3 assets/img/hero-poster.jpg
```

`-an` strips audio. Keep it — a hero video with an audio track will be
blocked from autoplaying by every browser.

## When the video does NOT play (by design)

The poster still shows instead, in all of these cases:

- `prefers-reduced-motion: reduce` is set
- viewport under 760px — mobile pays for the data and gains least
- the browser reports `saveData` or a 2G connection
- autoplay is refused by the browser
- the files are missing or fail to load

The video only fades in once it is genuinely playing, so a slow load shows
the still rather than a black rectangle. It also pauses when scrolled out of
view.

## Budget

Keep the mp4 under ~4 MB. This is a background texture, not content — if it
costs more than the rest of the page combined, encode it harder. `crf 28–30`
is usually invisible at this scale.
