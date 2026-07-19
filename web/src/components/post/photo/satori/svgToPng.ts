import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasmUrl from "@resvg/resvg-wasm/index_bg.wasm?url";
import { PHOTO_PIXEL_RATIO } from "@/components/post/photo/satori/tokens";

let wasmReady: Promise<void> | null = null;

async function ensureResvgWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = initWasm(fetch(resvgWasmUrl)).catch((err: unknown) => {
      // initWasm throws if called twice — treat as already ready
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Already initialized")) return;
      wasmReady = null;
      throw err;
    });
  }
  await wasmReady;
}

export async function svgToPngBlob(
  svg: string,
  pixelRatio: number = PHOTO_PIXEL_RATIO,
): Promise<Blob> {
  await ensureResvgWasm();
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "zoom",
      value: pixelRatio,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  pngData.free();
  return new Blob([pngBuffer], { type: "image/png" });
}

export async function svgToPngDataUrl(
  svg: string,
  pixelRatio: number = PHOTO_PIXEL_RATIO,
): Promise<string> {
  const blob = await svgToPngBlob(svg, pixelRatio);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("[post/photo/satori] Failed to read PNG data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}
