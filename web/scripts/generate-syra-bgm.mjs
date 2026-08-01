/**
 * Build a seam-safe Syra music bed from house-vibez (royalty-free).
 * Distinct from the Robinhood/Trancepad tech-house track.
 *
 * Usage: node scripts/generate-syra-bgm.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIRS = [
  join(ROOT, "public", "audio", "video"),
  join(ROOT, "remotion-public", "audio", "video"),
];

const SOURCE =
  process.env.SYRA_BGM_SOURCE ||
  "D:\\business\\trancepad-launch-video\\video-shotcraft\\assets\\audio\\bgm\\house-vibez.mp3";

const TARGET_SEC = 155;

function main() {
  if (!existsSync(SOURCE)) {
    console.error("Missing source BGM:", SOURCE);
    process.exit(1);
  }

  for (const dir of OUT_DIRS) mkdirSync(dir, { recursive: true });

  const primary = join(OUT_DIRS[0], "syra-bgm.mp3");

  // Self-crossfade removes the loop seam, then trim + loudnorm + gentle fades.
  // Filter chain:
  //  1. Load track twice, acrossfade 4s
  //  2. Trim to TARGET_SEC
  //  3. loudnorm
  //  4. fade in 1.5s / fade out 3s
  const filter = [
    "[0:a][1:a]acrossfade=d=4:c1=tri:c2=tri[xf]",
    `[xf]atrim=0:${TARGET_SEC},asetpts=PTS-STARTPTS[trim]`,
    `[trim]loudnorm=I=-15:TP=-1.5:LRA=11[ln]`,
    `[ln]afade=t=in:st=0:d=1.5,afade=t=out:st=${TARGET_SEC - 3}:d=3[out]`,
  ].join(";");

  const args = [
    "-y",
    "-i",
    SOURCE,
    "-i",
    SOURCE,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-b:a",
    "192k",
    primary,
  ];

  console.log("ffmpeg", args.join(" "));
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error("ffmpeg failed with status", result.status);
    process.exit(result.status ?? 1);
  }

  for (let i = 1; i < OUT_DIRS.length; i++) {
    const dest = join(OUT_DIRS[i], "syra-bgm.mp3");
    copyFileSync(primary, dest);
    console.log("Copied ->", dest);
  }

  console.log("Wrote", primary);
}

main();
