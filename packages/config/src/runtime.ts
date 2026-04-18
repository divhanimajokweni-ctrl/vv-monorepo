import { getEnv } from "./env";

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}