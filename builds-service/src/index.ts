import { createApp } from "./app";
import { db } from "./build-management/infrastructure/db";
import { DrizzleBuildRepository } from "./build-management/infrastructure/drizzle-build-repository";
import { GrpcPartsClient } from "./build-management/infrastructure/grpc-parts-client";

const repository = new DrizzleBuildRepository(db);
const partsClient = new GrpcPartsClient();
const app = createApp(repository, partsClient);

const port = process.env.PORT ?? 4002;

console.log(`Builds service running at http://localhost:${port}`);
console.log(`Scalar API docs at http://localhost:${port}/scalar`);

export default {
  port,
  fetch: app.fetch,
};
