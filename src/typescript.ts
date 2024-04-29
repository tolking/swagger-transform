import { config } from "./config";
import { read } from "./read";
import type { Config } from "./types";

export async function swaggerToType(option: Config) {
  const _config = Object.assign(config, option);
  if (!_config.entry) {
    throw new Error("[swagger-transform Error]: entry is required");
  }

  let content = await read(_config.entry);
  if (!content) return;
}
