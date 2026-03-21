import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { builds } from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/builds_db";
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

const seedData = [
  { name: "Gaming Beast", userId: "user-1" },
  { name: "Budget Workstation", userId: "user-1" },
  { name: "Streaming Setup", userId: "user-2" },
  { name: "Home Office PC", userId: "user-2" },
  { name: "Video Editing Rig", userId: "user-3" },
];

await db.execute(sql`DELETE FROM build_components`);
await db.execute(sql`DELETE FROM builds`);
await db.insert(builds).values(seedData);

console.log(`Seeded ${seedData.length} builds`);
await client.end();
