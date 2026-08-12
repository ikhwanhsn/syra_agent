# Syra × Tokens.xyz Explainer

Cinematic landscape explainer (1920×1080 @ 30fps, 105s) built with the [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) methodology: shot recipe cards, Remotion components, Syra brand, cinematic SFX + BGM.

## Quick start

```bash
cd videos/tokens-explainer
npm install
npm run studio          # preview
npm run render          # out/tokens-explainer.mp4 (with BGM)
npm run render:nobgm    # SFX-only deliverable
```

## Storyboard

See [STORYBOARD.md](./STORYBOARD.md).

## Brand

- Background `#050505`
- Accent gold `#F3BA2F`
- Fonts: Space Grotesk / Inter / JetBrains Mono
- Logo: `public/images/logo.png`

## Notes

- Demo metrics are fictional (not live market data).
- Remotion licensing: free for individuals/small teams; companies may need a paid license.
- Headless tip: `--concurrency=1` is already in the render script.
