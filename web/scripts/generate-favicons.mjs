import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const publicDir = join(root, "public");
// Mark-only (no "SYRA" wordmark) — wordmark becomes mush at 16–48px favicon sizes.
const SRC = join(publicDir, "images", "logo-transparent-notext.png");
const BG = { r: 10, g: 10, b: 15, alpha: 1 };

async function makePng(size, padRatio = 0.08) {
  // Flatten transparent mark onto brand canvas so light/dark tabs stay readable.
  const mark = await sharp(SRC)
    .flatten({ background: BG })
    .resize(size, size, { fit: "contain", background: BG })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

const sizes = {
  16: await makePng(16, 0.08),
  32: await makePng(32, 0.1),
  48: await makePng(48, 0.1),
  96: await makePng(96, 0.1),
  180: await makePng(180, 0.1),
  192: await makePng(192, 0.1),
  512: await makePng(512, 0.1),
};

writeFileSync(join(publicDir, "favicon-16x16.png"), sizes[16]);
writeFileSync(join(publicDir, "favicon-32x32.png"), sizes[32]);
writeFileSync(join(publicDir, "favicon-48x48.png"), sizes[48]);
writeFileSync(join(publicDir, "favicon-96x96.png"), sizes[96]);
writeFileSync(join(publicDir, "favicon.png"), sizes[48]);
writeFileSync(join(publicDir, "apple-touch-icon.png"), sizes[180]);
writeFileSync(join(publicDir, "android-chrome-192x192.png"), sizes[192]);
writeFileSync(join(publicDir, "android-chrome-512x512.png"), sizes[512]);

const ico = await pngToIco([sizes[16], sizes[32], sizes[48]]);
writeFileSync(join(publicDir, "favicon.ico"), ico);

const b64 = sizes[512].toString("base64");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Syra">
  <rect width="512" height="512" fill="#0a0a0f"/>
  <image href="data:image/png;base64,${b64}" width="512" height="512"/>
</svg>
`;
writeFileSync(join(publicDir, "favicon.svg"), svg);

console.log("Wrote favicons from", SRC);
console.log("favicon.ico", ico.length, "bytes");
for (const [k, v] of Object.entries(sizes)) {
  console.log(`  ${k}px`, v.length, "bytes");
}
