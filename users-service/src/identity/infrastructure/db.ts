import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const connectionString = Deno.env.get("DATABASE_URL") ??
  "postgres://postgres:postgres@localhost:5432/users_db";
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
