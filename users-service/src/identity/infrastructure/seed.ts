import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "../application/password.ts";
import { users } from "./schema.ts";

const connectionString = Deno.env.get("DATABASE_URL") ??
  "postgres://postgres:postgres@localhost:5432/users_db";
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

const seedUsers = [
  { email: "alice@example.com", username: "alice", password: "password123" },
  { email: "bob@example.com", username: "bob", password: "password123" },
  {
    email: "charlie@example.com",
    username: "charlie",
    password: "password123",
  },
];

await db.execute(sql`DELETE FROM users`);

for (const user of seedUsers) {
  const passwordHash = await hashPassword(user.password);
  await db.insert(users).values({
    email: user.email,
    username: user.username,
    passwordHash,
  });
}

console.log(`Seeded ${seedUsers.length} users`);
await client.end();
