#!/usr/bin/env python3
"""Warp the official Syra shield onto the mascot chest plate.

The mark is a decal on the sternum armor. Placement is hand-tuned per pose:
upright with only gentle foreshortening. Source: web/public/images/logo.jpg
"""

from __future__ import annotations

import math
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
OFFICIAL = ROOT / "web/public/images/logo.jpg"
ASSETS = Path(__file__).resolve().parents[1] / "assets"
MARK_OUT = ASSETS / "syra-mark.png"

# Hand-tuned quads (tl, tr, br, bl). Optional erase polygon if detection misses.
PLACEMENTS: dict[str, list[dict]] = {
    "poses/01-intro.png": [
        {"quad": [[428, 442], [486, 444], [478, 508], [430, 510]]},
    ],
    "poses/02-token.png": [
        {"quad": [[468, 414], [530, 414], [522, 486], [476, 486]]},
    ],
    "poses/03-pay.png": [
        {"quad": [[404, 508], [464, 506], [456, 576], [406, 578]]},
    ],
    "poses/04-verify.png": [
        {"quad": [[401, 509], [461, 507], [453, 576], [403, 578]]},
    ],
    "poses/05-go.png": [
        {"quad": [[460, 456], [526, 454], [516, 532], [464, 534]]},
    ],
    "syra-lynx-key.png": [
        {"quad": [[425, 510], [487, 508], [479, 580], [427, 582]]},
    ],
    "turnaround.png": [
        {"quad": [[240, 458], [300, 458], [292, 524], [246, 524]]},
        {"quad": [[650, 454], [704, 456], [698, 518], [650, 518]]},
        {
            "quad": [[1136, 462], [1144, 464], [1142, 520], [1134, 518]],
            "erase": [[1104, 448], [1132, 448], [1130, 528], [1102, 528]],
            "outline": True,
        },
    ],
    "expressions.png": [
        {"quad": [[400, 388], [456, 388], [450, 452], [404, 452]]},
        {"quad": [[1024, 390], [1074, 388], [1068, 452], [1022, 454]]},
        {"quad": [[408, 874], [464, 874], [458, 938], [412, 938]]},
        {"quad": [[1018, 874], [1074, 874], [1068, 938], [1022, 938]]},
    ],
    "x-idle.png": [
        {"quad": [[282, 442], [332, 440], [326, 498], [286, 500]]},
    ],
    "x-402.png": [
        {"quad": [[224, 492], [288, 490], [280, 552], [230, 554]]},
    ],
    "x-proof.png": [
        {"quad": [[228, 505], [292, 505], [284, 576], [232, 576]]},
    ],
}


def extract_official_mark(path: Path) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    w, h = src.size
    px = src.load()

    def is_bg(x: int, y: int) -> bool:
        r, g, b, _a = px[x, y]
        return r < 36 and g < 36 and b < 36

    seen = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y][x]:
            continue
        seen[y][x] = True
        if not is_bg(x, y):
            continue
        px[x, y] = (0, 0, 0, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    bbox = src.getbbox()
    if bbox is None:
        raise SystemExit(f"no mark pixels in {path}")
    pad = 8
    x0, y0, x1, y1 = bbox
    return src.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))


def _solve(a: list[list[float]], b: list[float]) -> list[float]:
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for i in range(n):
        pivot = max(range(i, n), key=lambda r: abs(m[r][i]))
        m[i], m[pivot] = m[pivot], m[i]
        div = m[i][i] or 1e-12
        for j in range(i, n + 1):
            m[i][j] /= div
        for r in range(n):
            if r == i:
                continue
            f = m[r][i]
            for j in range(i, n + 1):
                m[r][j] -= f * m[i][j]
    return [row[n] for row in m]


def perspective_coeffs(
    src: list[tuple[float, float]],
    dst: list[tuple[float, float]],
) -> tuple[float, ...]:
    """Map src quad -> dst quad (tl, tr, br, bl)."""
    matrix: list[list[float]] = []
    b: list[float] = []
    for (x, y), (u, v) in zip(dst, src):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        b.append(u)
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        b.append(v)
    return tuple(_solve(matrix, b))


def gentle_quad(cells: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """Upright shield box with a small taper from measured top vs bottom width."""
    xs = [c[0] for c in cells]
    ys = [c[1] for c in cells]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    h = max(1, maxy - miny)
    top = [c[0] for c in cells if c[1] <= miny + max(2, int(h * 0.22))]
    bot = [c[0] for c in cells if c[1] >= maxy - max(2, int(h * 0.22))]
    top_w = (max(top) - min(top)) if top else (maxx - minx)
    bot_w = (max(bot) - min(bot)) if bot else int((maxx - minx) * 0.86)
    if bot_w > top_w * 0.92:
        bot_w = int(top_w * 0.86)
    cx = (minx + maxx) / 2.0
    pad = 2
    return [
        (int(cx - top_w / 2 - pad), miny - pad),
        (int(cx + top_w / 2 + pad), miny - pad),
        (int(cx + bot_w / 2 + pad), maxy + pad),
        (int(cx - bot_w / 2 - pad), maxy + pad),
    ]


def silhouette_polygon(cells: list[tuple[int, int]], pad: int = 6) -> list[tuple[int, int]]:
    rows: dict[int, list[int]] = {}
    for x, y in cells:
        rows.setdefault(y, []).append(x)
    if not rows:
        return []
    ys = sorted(rows)
    y0, y1 = ys[0] - pad, ys[-1] + pad
    left: list[tuple[int, int]] = []
    right: list[tuple[int, int]] = []
    for y in range(y0, y1 + 1):
        src = rows.get(y) or rows.get(min(ys, key=lambda r: abs(r - y)))
        x0, x1 = min(src) - pad, max(src) + pad
        left.append((x0, y))
        right.append((x1, y))
    return left + right[::-1]


def expand_quad(quad: list[tuple[int, int]], px: float = 4.0) -> list[tuple[int, int]]:
    cx = sum(p[0] for p in quad) / 4.0
    cy = sum(p[1] for p in quad) / 4.0
    out: list[tuple[int, int]] = []
    for x, y in quad:
        dx, dy = x - cx, y - cy
        n = (dx * dx + dy * dy) ** 0.5 or 1.0
        out.append((int(round(x + px * dx / n)), int(round(y + px * dy / n))))
    return out


def tight_mark(mark: Image.Image) -> Image.Image:
    bbox = mark.getbbox()
    if bbox is None:
        return mark
    cropped = mark.crop(bbox).copy()
    px = cropped.load()
    w, h = cropped.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128 or (r + g + b) / 3 < 90:
                px[x, y] = (0, 0, 0, 0)
                continue
            if (r + g + b) / 3 >= 140:
                px[x, y] = (255, 255, 255, 255)
            else:
                px[x, y] = (0, 0, 0, 0)
    return cropped


def detect_chest_quads(im: Image.Image) -> list[tuple[list[tuple[int, int]], list[tuple[int, int]]]]:
    """White shield-like blobs on the torso. Skip muzzle (too high / too wide)."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    y0, y1 = int(h * 0.28), int(h * 0.95)
    x0, x1 = int(w * 0.08), int(w * 0.92)
    thresh = 168
    seen = set()
    quads: list[tuple[int, list[tuple[int, int]], list[tuple[int, int]]]] = []

    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x, y) in seen:
                continue
            r, g, b = px[x, y]
            if r < thresh or g < thresh or b < thresh:
                continue
            q: deque[tuple[int, int]] = deque([(x, y)])
            seen.add((x, y))
            cells: list[tuple[int, int]] = []
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (nx, ny) in seen:
                        continue
                    if not (x0 <= nx < x1 and y0 <= ny < y1):
                        seen.add((nx, ny))
                        continue
                    rr, gg, bb = px[nx, ny]
                    if rr >= thresh and gg >= thresh and bb >= thresh:
                        seen.add((nx, ny))
                        q.append((nx, ny))
                    else:
                        seen.add((nx, ny))
            area = len(cells)
            if area < 180 or area > 14000:
                continue
            xs = [c[0] for c in cells]
            ys = [c[1] for c in cells]
            bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
            aspect = bw / max(bh, 1)
            cy = (min(ys) + max(ys)) / 2
            if bh < 28 or bw < 22:
                continue
            if not (0.52 <= aspect <= 1.12):
                continue
            if cy < h * 0.32:
                continue
            top_cut = min(ys) + max(2, int(bh * 0.2))
            bot_cut = max(ys) - max(2, int(bh * 0.2))
            top_xs = [c[0] for c in cells if c[1] <= top_cut]
            bot_xs = [c[0] for c in cells if c[1] >= bot_cut]
            if top_xs and bot_xs:
                top_w = max(top_xs) - min(top_xs)
                bot_w = max(bot_xs) - min(bot_xs)
                if bot_w > top_w * 0.95:
                    continue
            quads.append((area, cells, gentle_quad(cells)))

    quads.sort(key=lambda t: t[0], reverse=True)
    merged: list[tuple[list[tuple[int, int]], list[tuple[int, int]]]] = []
    used = [False] * len(quads)
    for i, (_area, cells, quad) in enumerate(quads):
        if used[i]:
            continue
        used[i] = True
        union = list(cells)
        cx = sum(p[0] for p in quad) / 4
        cy = sum(p[1] for p in quad) / 4
        for j, (_a2, cells2, quad2) in enumerate(quads):
            if used[j]:
                continue
            cx2 = sum(p[0] for p in quad2) / 4
            cy2 = sum(p[1] for p in quad2) / 4
            if abs(cx - cx2) < 48 and abs(cy - cy2) < 48:
                used[j] = True
                union.extend(cells2)
        merged.append((union, gentle_quad(union)))
    return merged


def sample_armor(base: Image.Image, cells: list[tuple[int, int]]) -> tuple[int, int, int]:
    rgb = base.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    xs = [c[0] for c in cells]
    ys = [c[1] for c in cells]
    x0, y0 = max(0, min(xs) - 14), max(0, min(ys) - 14)
    x1, y1 = min(w, max(xs) + 15), min(h, max(ys) + 15)
    white = {(x, y) for x, y in cells}
    samples: list[tuple[int, int, int]] = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x, y) in white:
                continue
            r, g, b = px[x, y]
            if r + g + b > 210:
                continue
            if g > r + 40 and g > b + 20:
                continue
            samples.append((r, g, b))
    if not samples:
        return (18, 18, 18)
    samples.sort(key=lambda c: c[0] + c[1] + c[2])
    return samples[len(samples) // 2]


def erase_plate(
    base: Image.Image,
    quad: list[tuple[int, int]],
    color: tuple[int, int, int],
    cells: list[tuple[int, int]] | None = None,
) -> None:
    draw = ImageDraw.Draw(base)
    if cells:
        poly = silhouette_polygon(cells, pad=4)
        if len(poly) >= 3:
            draw.polygon(poly, fill=(*color, 255))
        return
    draw.polygon(expand_quad(quad, px=4.0), fill=(*color, 255))


def hollow_mark(mark: Image.Image) -> Image.Image:
    """Keep the white shield stroke; drop the black fill (side-view edge)."""
    out = mark.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and (r + g + b) / 3 < 90:
                px[x, y] = (0, 0, 0, 0)
    return out


def warp_mark(
    base: Image.Image,
    mark: Image.Image,
    quad: list[tuple[int, int]],
    outline: bool = False,
) -> None:
    mark = tight_mark(mark)
    if outline:
        mark = hollow_mark(mark)
    mw, mh = mark.size
    src = [(0.0, 0.0), (mw - 1.0, 0.0), (mw - 1.0, mh - 1.0), (0.0, mh - 1.0)]
    dst = [(float(x), float(y)) for x, y in quad]
    xs = [p[0] for p in quad]
    ys = [p[1] for p in quad]
    pad = 6
    bx0, by0 = max(0, min(xs) - pad), max(0, min(ys) - pad)
    bx1, by1 = min(base.width, max(xs) + pad), min(base.height, max(ys) + pad)
    local_dst = [(x - bx0, y - by0) for x, y in dst]
    coeffs = perspective_coeffs(src, local_dst)
    warped = mark.transform(
        (bx1 - bx0, by1 - by0),
        Image.Transform.PERSPECTIVE,
        coeffs,
        resample=Image.Resampling.BICUBIC,
    )
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.paste(warped, (bx0, by0), warped)
    base.paste(Image.alpha_composite(base, layer))


def paste_box(base: Image.Image, mark: Image.Image, spec: dict) -> None:
    x0, y0, x1, y1 = spec["box"]
    quad = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    if spec.get("rotate") or spec.get("squash"):
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        tw, th = (x1 - x0) * float(spec.get("squash", 1.0)), (y1 - y0)
        rad = math.radians(float(spec.get("rotate", 0.0)))
        c, s = math.cos(rad), math.sin(rad)
        corners = [(-tw / 2, -th / 2), (tw / 2, -th / 2), (tw / 2, th / 2), (-tw / 2, th / 2)]
        quad = [(int(cx + x * c - y * s), int(cy + x * s + y * c)) for x, y in corners]
    warp_mark(base, mark, quad)


def apply_to_image(path: Path, mark: Image.Image, specs: list[dict] | None, auto: bool) -> int:
    base = Image.open(path).convert("RGBA")
    detected = detect_chest_quads(base)
    n = 0
    if specs and not auto:
        for cells, dquad in detected:
            armor = sample_armor(base, cells)
            erase_plate(base, dquad, armor, cells)
        for spec in specs:
            if "erase" in spec:
                eq = [tuple(p) for p in spec["erase"]]
                armor = sample_armor(base, eq)
                erase_plate(base, eq, armor)
            if "quad" in spec:
                warp_mark(
                    base,
                    mark,
                    [tuple(p) for p in spec["quad"]],
                    outline=bool(spec.get("outline")),
                )
                n += 1
            elif "box" in spec:
                paste_box(base, mark, spec)
                n += 1
    else:
        for cells, quad in detected:
            armor = sample_armor(base, cells)
            erase_plate(base, quad, armor, cells)
            warp_mark(base, mark, quad)
            n += 1
        if n == 0 and specs:
            for spec in specs:
                if "quad" in spec:
                    warp_mark(
                        base,
                        mark,
                        [tuple(p) for p in spec["quad"]],
                        outline=bool(spec.get("outline")),
                    )
                    n += 1
                elif "box" in spec:
                    paste_box(base, mark, spec)
                    n += 1
    if n:
        base.convert("RGB").save(path, optimize=True)
    return n


def debug_quads(path: Path, out: Path, specs: list[dict] | None) -> None:
    im = Image.open(path).convert("RGBA")
    vis = im.copy()
    d = ImageDraw.Draw(vis)
    for _cells, quad in detect_chest_quads(im):
        d.polygon(quad, outline=(0, 255, 120, 255))
        for p in quad:
            d.ellipse((p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3), fill=(0, 255, 120, 255))
    if specs:
        for spec in specs:
            if "quad" in spec:
                quad = [tuple(p) for p in spec["quad"]]
                d.polygon(quad, outline=(80, 180, 255, 255))
                for p in quad:
                    d.ellipse((p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3), fill=(80, 180, 255, 255))
    vis.convert("RGB").save(out)


def main() -> None:
    import sys

    auto = "--auto" in sys.argv
    debug = "--debug" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    mark = extract_official_mark(OFFICIAL)
    ASSETS.mkdir(parents=True, exist_ok=True)
    mark.save(MARK_OUT)
    print(f"wrote {MARK_OUT.relative_to(ROOT)} {mark.size}")

    targets: list[Path] = []
    if only:
        for a in only:
            p = Path(a)
            if not p.is_absolute():
                p = ASSETS / a
            if p.is_dir():
                targets.extend(sorted(p.glob("*.png")))
            else:
                targets.append(p)
    else:
        targets = [ASSETS / name for name in PLACEMENTS]
        targets.extend(sorted((ASSETS / "poses").glob("*.png")))

    seen: set[Path] = set()
    for path in targets:
        path = path.resolve()
        if path in seen or not path.exists():
            continue
        seen.add(path)
        if path.name == "syra-mark.png" or path.name.endswith("-quads.png"):
            continue
        rel = str(path.relative_to(ASSETS)) if ASSETS in path.parents or path.parent == ASSETS else path.name
        specs = PLACEMENTS.get(rel) or PLACEMENTS.get(path.name)
        if debug:
            debug_quads(path, path.with_name(path.stem + "-quads.png"), specs)
            print(f"debug {rel}")
            continue
        n = apply_to_image(path, mark, specs, auto=auto)
        print(f"{'warped' if n else 'skip'} {rel} n={n}")


if __name__ == "__main__":
    main()
