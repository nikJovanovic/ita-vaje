import { createApp } from "./app";
import { db } from "./catalog/infrastructure/db";
import { DrizzleComponentRepository } from "./catalog/infrastructure/drizzle-component-repository";

const repository = new DrizzleComponentRepository(db);
const app = createApp(repository).listen(process.env.PORT ?? 4001);

console.log(`Parts service running at http://localhost:${app.server?.port}`);
console.log(`OpenAPI docs at http://localhost:${app.server?.port}/openapi`);
