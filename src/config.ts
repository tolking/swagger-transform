import type { Config } from "./types";

export const config: Partial<Config> = {
  api: false,
  outDir: "swagger",
  apiOutDir: "swagger",
  typeMap: {
    integer: "number",
  },
}
