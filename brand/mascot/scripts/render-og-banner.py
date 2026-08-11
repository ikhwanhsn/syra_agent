#!/usr/bin/env python3
"""Render Syra Open Graph banners: institutional lockup, no mascot.

1200x630 (Facebook / X / LinkedIn / Telegram / Discord)
1200x1200 (WhatsApp / iMessage square crop)
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONTS = ROOT / "fonts"
OUT = ROOT / "og"
WEB_IMAGES = ROOT.parents[1] / "web" / "public" / "images"
MARK = ASSETS / "syra-mark.png"

BG = (5, 5, 5, 255)
WHITE = (255, 255, 255, 255)
MUTED = (168, 168, 168, 255)
FAINT = (110, 110, 110, 255)
CYAN = (62, 224, 184, 255)
HAIR = (255, 255, 255, 36)

OG_W, OG_H = 1200, 630
SQUARE = 1200


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def knockout_black(im: Image.Image, thresh: int = 18) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (0, 0, 0, 0)
    return im


def content_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 12:
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    pad = 4
    return (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + 1 + pad),
        min(h, maxy + 1 + pad),
    )


def load_mark() -> Image.Image:
    mark = knockout_black(Image.open(MARK))
    return mark.crop(content_bbox(mark))


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    fill,
    tracking: int,
) -> int:
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += int(draw.textlength(ch, font=fnt)) + tracking
    return x


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt, tracking: int = 0) -> int:
    if tracking == 0:
        return int(draw.textlength(text, font=fnt))
    return int(sum(draw.textlength(ch, font=fnt) + tracking for ch in text) - tracking)


def centered_x(draw: ImageDraw.ImageDraw, text: str, fnt, canvas_w: int, tracking: int = 0) -> int:
    return (canvas_w - text_width(draw, text, fnt, tracking)) // 2


def draw_vignette(base: Image.Image) -> None:
    overlay = Image.new("L", base.size, 0)
    d = ImageDraw.Draw(overlay)
    w, h = base.size
    d.ellipse((-int(w * 0.05), -int(h * 0.35), int(w * 1.05), int(h * 1.15)), fill=255)
    overlay = overlay.filter(ImageFilter.GaussianBlur(90))
    shade = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shade.putalpha(Image.eval(overlay, lambda p: int((255 - p) * 0.42)))
    base.alpha_composite(shade)


def draw_cyan_bloom(base: Image.Image, cx: int, cy: int, rx: int, ry: int, alpha: int = 38) -> None:
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(62, 224, 184, alpha))
    base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(72)))


def draw_circuit(base: Image.Image, nodes: list[tuple[int, int]], edges: list[tuple[int, int]], live: int) -> None:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for a, b in edges:
        d.line([nodes[a], nodes[b]], fill=(255, 255, 255, 22), width=2)
    for i, (x, y) in enumerate(nodes):
        r = 7 if i == live else 5
        fill = (62, 224, 184, 160) if i == live else (255, 255, 255, 0)
        outline = CYAN if i == live else (255, 255, 255, 40)
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill, outline=outline, width=2)
    base.alpha_composite(overlay)


def draw_frame(draw: ImageDraw.ImageDraw, w: int, h: int, inset: int, arm: int) -> None:
    x0, y0, x1, y1 = inset, inset, w - inset, h - inset
    for (ax, ay, bx, by) in (
        (x0, y0, x0 + arm, y0),
        (x0, y0, x0, y0 + arm),
        (x1, y0, x1 - arm, y0),
        (x1, y0, x1, y0 + arm),
        (x0, y1, x0 + arm, y1),
        (x0, y1, x0, y1 - arm),
        (x1, y1, x1 - arm, y1),
        (x1, y1, x1, y1 - arm),
    ):
        draw.line([(ax, ay), (bx, by)], fill=HAIR, width=2)


def place_mark(canvas: Image.Image, mark: Image.Image, cx: int, cy: int, height: int) -> tuple[int, int]:
    stamp_h = height
    stamp_w = max(1, int(mark.width * (stamp_h / mark.height)))
    stamp = mark.resize((stamp_w, stamp_h), Image.Resampling.LANCZOS)
    x = cx - stamp_w // 2
    y = cy - stamp_h // 2
    canvas.alpha_composite(stamp, (x, y))
    return stamp_w, stamp_h


def render_landscape(mark: Image.Image) -> Image.Image:
    scale = 2
    w, h = OG_W * scale, OG_H * scale
    canvas = Image.new("RGBA", (w, h), BG)
    d = ImageDraw.Draw(canvas)

    nodes = [
        (160, 180),
        (420, 110),
        (780, 160),
        (1180, 90),
        (1680, 150),
        (2140, 200),
        (200, 620),
        (520, 540),
        (1880, 520),
        (2220, 640),
        (180, 1080),
        (560, 1160),
        (980, 1200),
        (1500, 1140),
        (1960, 1100),
        (2280, 1020),
    ]
    edges = [
        (0, 1),
        (1, 2),
        (2, 3),
        (3, 4),
        (4, 5),
        (0, 6),
        (6, 7),
        (5, 9),
        (8, 9),
        (10, 11),
        (11, 12),
        (12, 13),
        (13, 14),
        (14, 15),
        (6, 10),
        (9, 15),
        (4, 8),
    ]
    draw_circuit(canvas, nodes, edges, live=8)
    draw_cyan_bloom(canvas, w // 2, 430, 420, 220, 32)
    draw_vignette(canvas)
    draw_frame(d, w, h, 56, 44)

    place_mark(canvas, mark, w // 2, 268, 148)

    kicker_f = font("SpaceGrotesk-Medium.ttf", 22)
    kicker = "MACHINE MONEY FOR AGENTS"
    draw_tracked(
        d,
        kicker,
        (centered_x(d, kicker, kicker_f, w, 8), 372),
        kicker_f,
        CYAN,
        8,
    )

    word_f = font("SpaceGrotesk-Bold.ttf", 168)
    word = "SYRA"
    d.text((centered_x(d, word, word_f, w), 430), word, font=word_f, fill=WHITE)

    sub_f = font("SpaceGrotesk-Regular.ttf", 34)
    sub = "x402 pay-per-call APIs  ·  MCP  ·  typed SDK"
    d.text((centered_x(d, sub, sub_f, w), 640), sub, font=sub_f, fill=MUTED)

    rule_w = 88
    d.rectangle(((w - rule_w) // 2, 706, (w + rule_w) // 2, 710), fill=CYAN)

    pillars = ["EARN", "TREASURY", "INVEST", "SPEND", "GROW"]
    live = "SPEND"
    pf = font("SpaceGrotesk-Medium.ttf", 22)
    gap = 56
    widths = [text_width(d, p, pf, 4) for p in pillars]
    total = sum(widths) + gap * (len(pillars) - 1)
    x = (w - total) // 2
    y = 760
    for p, pw in zip(pillars, widths):
        draw_tracked(d, p, (x, y), pf, CYAN if p == live else FAINT, 4)
        x += pw + gap

    url_f = font("SpaceGrotesk-Regular.ttf", 24)
    d.text((w - 56 - int(d.textlength("syraa.fun", font=url_f)), 1128), "syraa.fun", font=url_f, fill=FAINT)

    return canvas.convert("RGB").resize((OG_W, OG_H), Image.Resampling.LANCZOS)


def render_square(mark: Image.Image) -> Image.Image:
    scale = 2
    w = h = SQUARE * scale
    canvas = Image.new("RGBA", (w, h), BG)
    d = ImageDraw.Draw(canvas)

    nodes = [
        (180, 200),
        (500, 140),
        (1100, 180),
        (1900, 220),
        (2220, 400),
        (200, 1100),
        (2200, 1200),
        (240, 2100),
        (700, 2220),
        (1600, 2180),
        (2160, 2060),
    ]
    edges = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (4, 6), (7, 8), (8, 9), (9, 10), (5, 7), (6, 10)]
    draw_circuit(canvas, nodes, edges, live=2)
    draw_cyan_bloom(canvas, w // 2, 780, 480, 320, 34)
    draw_vignette(canvas)
    draw_frame(d, w, h, 72, 52)

    place_mark(canvas, mark, w // 2, 720, 260)

    kicker_f = font("SpaceGrotesk-Medium.ttf", 28)
    kicker = "MACHINE MONEY FOR AGENTS"
    draw_tracked(
        d,
        kicker,
        (centered_x(d, kicker, kicker_f, w, 8), 900),
        kicker_f,
        CYAN,
        8,
    )

    word_f = font("SpaceGrotesk-Bold.ttf", 188)
    word = "SYRA"
    d.text((centered_x(d, word, word_f, w), 980), word, font=word_f, fill=WHITE)

    sub_f = font("SpaceGrotesk-Regular.ttf", 36)
    sub = "x402  ·  MCP  ·  typed SDK"
    d.text((centered_x(d, sub, sub_f, w), 1220), sub, font=sub_f, fill=MUTED)

    rule_w = 96
    d.rectangle(((w - rule_w) // 2, 1296, (w + rule_w) // 2, 1300), fill=CYAN)

    pillars = ["EARN", "TREASURY", "INVEST", "SPEND", "GROW"]
    pf = font("SpaceGrotesk-Medium.ttf", 24)
    gap = 48
    widths = [text_width(d, p, pf, 4) for p in pillars]
    total = sum(widths) + gap * (len(pillars) - 1)
    x = (w - total) // 2
    for p, pw in zip(pillars, widths):
        draw_tracked(d, p, (x, 1360), pf, CYAN if p == "SPEND" else FAINT, 4)
        x += pw + gap

    url_f = font("SpaceGrotesk-Regular.ttf", 28)
    d.text((centered_x(d, "syraa.fun", url_f, w), 2148), "syraa.fun", font=url_f, fill=FAINT)

    return canvas.convert("RGB").resize((SQUARE, SQUARE), Image.Resampling.LANCZOS)


def save_png(path: Path, im: Image.Image) -> None:
    im.save(path, format="PNG", optimize=True, compress_level=9)


def save_jpg(path: Path, im: Image.Image) -> None:
    im.save(path, format="JPEG", quality=86, optimize=True, subsampling=0)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    WEB_IMAGES.mkdir(parents=True, exist_ok=True)
    mark = load_mark()

    landscape = render_landscape(mark)
    square = render_square(mark)

    targets = [
        (OUT / "og-banner.png", landscape, "png"),
        (OUT / "og-banner.jpg", landscape, "jpg"),
        (OUT / "og-square.png", square, "png"),
        (WEB_IMAGES / "og-banner.png", landscape, "png"),
        (WEB_IMAGES / "og-banner.jpg", landscape, "jpg"),
        (WEB_IMAGES / "og-square.png", square, "png"),
    ]
    for path, im, kind in targets:
        if kind == "jpg":
            save_jpg(path, im)
        else:
            save_png(path, im)
        print(f"wrote {path} {im.size} {path.stat().st_size}B")


if __name__ == "__main__":
    main()
