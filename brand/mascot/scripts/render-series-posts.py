#!/usr/bin/env python3
"""Render the 5-post mascot growth series (16:9 landscape). Real type + official mark."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONTS = ROOT / "fonts"
OUT = ROOT / "series"
POSES = ASSETS / "poses"
MARK = ASSETS / "syra-mark.png"

BG = (5, 5, 5, 255)
WHITE = (255, 255, 255, 255)
MUTED = (200, 200, 200, 255)
FAINT = (140, 140, 140, 255)
CYAN = (62, 224, 184, 255)
LINE = (255, 255, 255, 48)

POSTS = [
    {
        "slug": "01-what-is",
        "pose": "01-intro",
        "kicker": "WHAT IS SYRA",
        "headline": "Machine money\nfor agents.",
        "sub": "Crypto intel agents can buy per call.",
        "bullets": [
            "HTTP 402. Pay USDC. Get the route.",
            "MCP in Cursor and Claude.",
            "Typed SDK. No monthly lock-in.",
        ],
        "pills": ["SPEND", "LIVE", "X402"],
        "footer": "syraa.fun",
        "accent_pill": 1,
    },
    {
        "slug": "02-token",
        "pose": "02-token",
        "kicker": "$SYRA",
        "headline": "Usage buys\nthe token.",
        "sub": "Hold utility you can check. Not a return promise.",
        "bullets": [
            "About 80% of treasury revenue to buyback.",
            "5 to 30% off x402 by holder tier.",
            "Claim rewards on /rewards.",
        ],
        "pills": ["BUYBACK", "DISCOUNT", "CLAIM"],
        "footer": "syraa.fun/token",
        "accent_pill": 0,
    },
    {
        "slug": "03-x402",
        "pose": "03-pay",
        "kicker": "PAY PER CALL",
        "headline": "HTTP 402.\nThen the data.",
        "sub": "No API key spreadsheet. No monthly plan.",
        "bullets": [
            "Agent hits the route.",
            "402: settle USDC on-chain.",
            "200: intel comes back.",
        ],
        "pills": ["402", "USDC", "SETTLE"],
        "footer": "syraa.fun/marketplace",
        "accent_pill": 0,
    },
    {
        "slug": "04-receipts",
        "pose": "04-verify",
        "kicker": "RECEIPTS",
        "headline": "Verify it.\nDon't trust a thread.",
        "sub": "Same numbers in the product and on-chain.",
        "bullets": [
            "/token : Solscan-linked buybacks.",
            "/api/metrics : JSON anyone can hit.",
            "/rewards : claim what you earned.",
        ],
        "pills": ["SOLSCAN", "METRICS", "LIVE"],
        "footer": "syraa.fun/token",
        "accent_pill": 2,
    },
    {
        "slug": "05-start",
        "pose": "05-go",
        "kicker": "START",
        "headline": "First paid call\nin minutes.",
        "sub": "Fund USDC. Install MCP. Send the agent.",
        "bullets": [
            "Fund Solana USDC (about $1).",
            "npx -y @syra-ai/mcp-server",
            "Call news, signals, research.",
        ],
        "pills": ["MCP", "SDK", "MARKET"],
        "footer": "docs.syraa.fun",
        "accent_pill": 0,
    },
]


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def content_bbox(im: Image.Image, thresh: int = 18) -> tuple[int, int, int, int]:
    px = im.convert("RGB").load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > thresh or g > thresh or b > thresh:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    pad = 16
    return (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + 1 + pad),
        min(h, maxy + 1 + pad),
    )


def draw_tracked(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], fnt, fill, tracking: int) -> None:
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += int(draw.textlength(ch, font=fnt)) + tracking


def draw_pills(draw: ImageDraw.ImageDraw, x: int, y: int, labels: list[str], accent: int) -> None:
    f = font("SpaceGrotesk-Medium.ttf", 16)
    for i, label in enumerate(labels):
        tw = int(draw.textlength(label, font=f))
        box = (x, y, x + tw + 36, y + 40)
        on = i == accent
        draw.rounded_rectangle(
            box,
            radius=20,
            fill=(10, 36, 30, 255) if on else (22, 22, 22, 255),
            outline=CYAN if on else LINE,
            width=1,
        )
        draw.text((x + 18, y + 9), label, font=f, fill=CYAN if on else WHITE)
        x = box[2] + 10


def draw_grid(base: Image.Image, step: int = 54, alpha: int = 14) -> None:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = base.size
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(255, 255, 255, alpha))
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
    base.alpha_composite(overlay)


def place_lynx(canvas: Image.Image, lynx: Image.Image, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    tw, th = max(1, x1 - x0), max(1, y1 - y0)
    src = lynx.convert("RGBA")
    scale = min(tw / src.width, th / src.height)
    nw, nh = max(1, int(src.width * scale)), max(1, int(src.height * scale))
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)

    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx = x0 + tw // 2
    cy = y0 + int(th * 0.55)
    gd.ellipse(
        (cx - int(nw * 0.4), cy - int(nh * 0.28), cx + int(nw * 0.4), cy + int(nh * 0.36)),
        fill=(62, 224, 184, 26),
    )
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(42)))
    canvas.alpha_composite(src, (x0 + (tw - nw) // 2, y0 + th - nh))


def load_pose(pose: str) -> Image.Image:
    im = Image.open(POSES / f"{pose}.png").convert("RGBA")
    return im.crop(content_bbox(im))


def render_post(spec: dict, lynx: Image.Image, mark: Image.Image) -> Image.Image:
    w, h = 1920, 1080
    canvas = Image.new("RGBA", (w, h), BG)
    draw_grid(canvas, 56, 12)
    d = ImageDraw.Draw(canvas)

    place_lynx(canvas, lynx, (24, 40, 900, 1040))

    x = 980
    y = 88

    stamp_h = 52
    stamp_w = int(mark.width * (stamp_h / mark.height))
    stamp = mark.resize((stamp_w, stamp_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(stamp, (x, y))
    d.text((x + stamp_w + 16, y + 10), "SYRA", font=font("SpaceGrotesk-Bold.ttf", 28), fill=WHITE)
    y = 172

    draw_tracked(d, spec["kicker"], (x, y), font("SpaceGrotesk-Medium.ttf", 16), CYAN, 4)
    y = 216

    headline_font = font("SpaceGrotesk-Bold.ttf", 64)
    for line in spec["headline"].split("\n"):
        d.text((x, y), line, font=headline_font, fill=WHITE)
        y += 74
    y += 10
    d.text((x, y), spec["sub"], font=font("SpaceGrotesk-Regular.ttf", 24), fill=MUTED)
    y += 46
    d.rectangle((x, y, x + 88, y + 3), fill=CYAN)
    y += 32

    bf = font("SpaceGrotesk-Regular.ttf", 24)
    for i, bullet in enumerate(spec["bullets"], start=1):
        d.text((x, y), f"{i:02d}", font=font("SpaceGrotesk-Medium.ttf", 20), fill=CYAN)
        d.text((x + 58, y - 2), bullet, font=bf, fill=WHITE)
        y += 42

    draw_pills(d, x, 860, spec["pills"], spec["accent_pill"])
    d.text((x, 980), spec["footer"], font=font("SpaceGrotesk-Regular.ttf", 18), fill=FAINT)
    return canvas.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mark = Image.open(MARK).convert("RGBA")
    for spec in POSTS:
        lynx = load_pose(spec["pose"])
        img = render_post(spec, lynx, mark)
        path = OUT / f"{spec['slug']}.png"
        img.save(path, optimize=True)
        print(f"wrote {path} {img.size}")


if __name__ == "__main__":
    main()
