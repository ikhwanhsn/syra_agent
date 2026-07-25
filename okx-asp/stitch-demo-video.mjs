#!/usr/bin/env node
/**
 * Stitch Genesis demo clips into one ≤90s MP4.
 *
 * Requires: ffmpeg on PATH
 * Inputs:  okx-asp/video-clips/01-hook.mp4 … 04-close.mp4
 * Output:  okx-asp/out/syra-okxai-genesis-finance-copilot.mp4
 *
 *   node okx-asp/stitch-demo-video.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clipsDir = join(root, "okx-asp", "video-clips");
const outDir = join(root, "okx-asp", "out");
const outFile = join(outDir, "syra-okxai-genesis-finance-copilot.mp4");

const ORDER = [
  "01-hook.mp4",
  "02-problem.mp4",
  "03a-ask.mp4",
  "03b-pay.mp4",
  "03c-report.mp4",
  "04a-catalog.mp4",
  "04b-close.mp4",
];

function whichFfmpeg() {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", ["ffmpeg"], {
    encoding: "utf8",
  });
  if (r.status === 0 && r.stdout.trim()) return "ffmpeg";
  return null;
}

function main() {
  mkdirSync(outDir, { recursive: true });
  const missing = ORDER.filter((f) => !existsSync(join(clipsDir, f)));
  if (missing.length) {
    console.error("Missing clips:");
    for (const m of missing) console.error(`  - ${join(clipsDir, m)}`);
    console.error("\nGenerate first: node okx-asp/generate-demo-clips.mjs");
    console.error(`Present: ${readdirSync(clipsDir).join(", ") || "(none)"}`);
    process.exit(1);
  }

  if (!whichFfmpeg()) {
    console.error("ffmpeg not found on PATH.");
    console.error("Install: winget install Gyan.FFmpeg");
    process.exit(1);
  }

  const listPath = join(outDir, "concat-list.txt");
  const listBody = ORDER.map((f) => `file '${join(clipsDir, f).replace(/\\/g, "/")}'`).join("\n");
  writeFileSync(listPath, listBody, "utf8");

  // Re-encode for consistent codec/timebase (concat copy often fails across models)
  const args = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-vf",
    "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outFile,
  ];

  console.log("ffmpeg", args.join(" "));
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);

  console.log(`\nWrote ${outFile}`);
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", outFile],
    { encoding: "utf8" },
  );
  if (probe.status === 0) {
    const sec = Number(probe.stdout.trim());
    console.log(`Duration: ${sec.toFixed(1)}s ${sec > 90 ? "(OVER 90s — trim before posting)" : "(OK ≤90s)"}`);
  }
}

main();
