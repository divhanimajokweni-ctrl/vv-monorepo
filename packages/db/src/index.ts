import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";
import * as schemaSpine from "./schema-spine";

export const db = createDatabase({ ...schema, ...schemaSpine });
export * from "./client";
export * from "./schema";
export * from "./schema-spine";
export * from "./schema-credit";
export * from "./schema-games";
