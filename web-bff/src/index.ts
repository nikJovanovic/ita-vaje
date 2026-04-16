import { createApp } from "./app";
import { HttpBuildsClient } from "./clients/builds-client";
import { GrpcPartsClient } from "./clients/grpc-parts-client";
import { HttpUsersClient } from "./clients/users-client";

const app = createApp({
  parts: new GrpcPartsClient(),
  builds: new HttpBuildsClient(),
  users: new HttpUsersClient(),
});

const port = Number(process.env.PORT ?? 4004);

console.log(`web-bff running at http://localhost:${port}`);
console.log(`Swagger UI at http://localhost:${port}/swagger`);

export default {
  port,
  fetch: app.fetch,
};
