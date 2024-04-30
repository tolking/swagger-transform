import { defaultConfig } from "./config";
import { definitionsToType } from "./definitions";
import { pathsToApis } from "./paths";
import { read } from "./read";
import type { Config } from "./types";

export async function swaggerToType(option: Config) {
  const config = Object.assign({}, defaultConfig, option);
  if (!config.entry) {
    throw new Error("[swagger-transform Error]: entry is required");
  }

  let content = await read(config.entry);
  if (!content) return;
  definitionsToType(content, config);
  config.api && pathsToApis(content, config);
}
