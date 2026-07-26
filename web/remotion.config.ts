import path from "node:path";
import { Config } from "@remotion/cli/config";

/** Remotion CLI loads this as CJS, use process.cwd() (run from web/). */
const rootDir = process.cwd();

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
/** Slim public for CLI, full `public/` has huge SEO HTML and times out Chromium. */
Config.setPublicDir("remotion-public");
Config.setTimeoutInMilliseconds(120_000);

Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        "@": path.join(rootDir, "src"),
      },
      extensions: [
        ...(config.resolve?.extensions ?? [".js", ".json"]),
        ".ts",
        ".tsx",
        ".jsx",
        ".mjs",
      ],
    },
  };
});
