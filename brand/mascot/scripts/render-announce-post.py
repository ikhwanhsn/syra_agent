#!/usr/bin/env python3
"""Render the Syra mascot announcement posts (real type + official mark)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONTS = ROOT / "fonts"
OUT = ROOT / "announce"
LYNX = ASSETS / "syra-lynx-key.png"
MARK = ASSETS / "syra-mark.png"

BG = (5, 5, 5, 255)
WHITE = (255, 255, 255, 255)
MUTED = (255, 255, 255, 122)
FAINT = (255, 255, 255, 72)
CYAN = (62, 224, 184, 255)
LINE = (255, 255, 255, 28)


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
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    pad = 24
    return (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + 1 + pad),
        min(h, maxy + 1 + pad),
    )


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    fill,
    tracking: int,
) -> None:
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += int(draw.textlength(ch, font=fnt)) + tracking


def draw_pills(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    f = font("SpaceGrotesk-Medium.ttf", 18)
    for i, label in enumerate(["CALM", "PRECISE", "PAID"]):
        tw = int(draw.textlength(label, font=f))
        box = (x, y, x + tw + 40, y + 44)
        accent = i == 1
        rounded_rect(
            draw,
            box,
            22,
            fill=(10, 36, 30, 255) if accent else (22, 22, 22, 255),
            outline=CYAN if accent else (255, 255, 255, 48),
            width=1,
        )
        draw.text((x + 20, y + 10), label, font=f, fill=CYAN if accent else WHITE)
        x = box[2] + 12


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill=None,
    outline=None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_grid(base: Image.Image, step: int = 48, alpha: int = 18) -> None:
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
    tw, th = x1 - x0, y1 - y0
    src = lynx.convert("RGBA")
    scale = min(tw / src.width, th / src.height)
    nw, nh = int(src.width * scale), int(src.height * scale)
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)

    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx = x0 + tw // 2
    cy = y0 + int(th * 0.58)
    gd.ellipse(
        (cx - int(nw * 0.42), cy - int(nh * 0.28), cx + int(nw * 0.42), cy + int(nh * 0.38)),
        fill=(62, 224, 184, 28),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(48))
    canvas.alpha_composite(glow)

    px = x0 + (tw - nw) // 2
    py = y0 + th - nh
    canvas.alpha_composite(src, (px, py))


def render_portrait(lynx: Image.Image, mark: Image.Image) -> Image.Image:
    w, h = 1080, 1350
    canvas = Image.new("RGBA", (w, h), BG)
    draw_grid(canvas, 54, 14)
    d = ImageDraw.Draw(canvas)
    pad = 72

    stamp_h = 52
    stamp_w = int(mark.width * (stamp_h / mark.height))
    stamp = mark.resize((stamp_w, stamp_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(stamp, (pad, 56))
    d.text((pad + stamp_w + 16, 64), "SYRA", font=font("SpaceGrotesk-Bold.ttf", 28), fill=WHITE)

    draw_tracked(d, "NEW MASCOT", (pad, 148), font("SpaceGrotesk-Medium.ttf", 15), CYAN, 4)
    d.text((pad, 186), "This is Syra.", font=font("SpaceGrotesk-Bold.ttf", 72), fill=WHITE)
    d.text(
        (pad, 278),
        "The agent you send out.",
        font=font("SpaceGrotesk-Regular.ttf", 28),
        fill=MUTED,
    )
    d.rectangle((pad, 328, pad + 88, 331), fill=CYAN)

    place_lynx(canvas, lynx, (40, 340, w - 40, 1188))

    draw_pills(d, pad, 1210)

    d.text(
        (pad, 1280),
        "Machine money for agents   syraa.fun",
        font=font("SpaceGrotesk-Regular.ttf", 16),
        fill=FAINT,
    )
    return canvas.convert("RGB")


def render_landscape(lynx: Image.Image, mark: Image.Image) -> Image.Image:
    w, h = 1920, 1080
    canvas = Image.new("RGBA", (w, h), BG)
    draw_grid(canvas, 56, 12)
    d = ImageDraw.Draw(canvas)
    pad = 80

    place_lynx(canvas, lynx, (40, 80, 980, 1040))

    x = 1020
    stamp_h = 56
    stamp_w = int(mark.width * (stamp_h / mark.height))
    stamp = mark.resize((stamp_w, stamp_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(stamp, (x, 168))
    d.text((x + stamp_w + 18, 178), "SYRA", font=font("SpaceGrotesk-Bold.ttf", 30), fill=WHITE)

    draw_tracked(d, "NEW MASCOT", (x, 268), font("SpaceGrotesk-Medium.ttf", 16), CYAN, 4)
    d.text((x, 310), "This is Syra.", font=font("SpaceGrotesk-Bold.ttf", 82), fill=WHITE)
    d.text(
        (x, 416),
        "The agent you send out.",
        font=font("SpaceGrotesk-Regular.ttf", 32),
        fill=MUTED,
    )
    d.rectangle((x, 472, x + 96, 475), fill=CYAN)
    d.text(
        (x, 508),
        "Settle x402. Fetch intel. Return with proof.",
        font=font("SpaceGrotesk-Regular.ttf", 24),
        fill=MUTED,
    )

    draw_pills(d, x, 598)

    d.text(
        (x, 980),
        "Machine money for agents   syraa.fun",
        font=font("SpaceGrotesk-Regular.ttf", 18),
        fill=FAINT,
    )
    return canvas.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    raw = Image.open(LYNX).convert("RGBA")
    lynx = raw.crop(content_bbox(raw))
    mark = Image.open(MARK).convert("RGBA")

    portrait = render_portrait(lynx, mark)
    landscape = render_landscape(lynx, mark)
    portrait.save(OUT / "x-announce-4x5.png", optimize=True)
    landscape.save(OUT / "x-announce-16x9.png", optimize=True)
    print(f"wrote {OUT / 'x-announce-4x5.png'} {portrait.size}")
    print(f"wrote {OUT / 'x-announce-16x9.png'} {landscape.size}")


if __name__ == "__main__":
    main()
