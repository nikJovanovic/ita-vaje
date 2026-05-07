import { createApp } from "./app";
import { HttpBuildsClient } from "./clients/builds-client";
import { GrpcPartsClient } from "./clients/grpc-parts-client";
import {
  ResilientBuildsClient,
  ResilientPartsClient,
  ResilientUsersClient,
} from "./clients/resilient-clients";
import { HttpUsersClient } from "./clients/users-client";

const app = createApp({
  parts: new ResilientPartsClient(new GrpcPartsClient()),
  builds: new ResilientBuildsClient(new HttpBuildsClient()),
  users: new ResilientUsersClient(new HttpUsersClient()),
});

const port = Number(process.env.PORT ?? 4005);

app.listen(port);

console.log(`mobile-bff running at http://localhost:${port}`);
console.log(`Swagger UI at http://localhost:${port}/swagger`);
