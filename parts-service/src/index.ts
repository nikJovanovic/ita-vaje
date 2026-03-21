import { ComponentService } from "./catalog/application/component-service";
import { db } from "./catalog/infrastructure/db";
import { DrizzleComponentRepository } from "./catalog/infrastructure/drizzle-component-repository";
import { startGrpcServer } from "./catalog/infrastructure/grpc-server";

const repository = new DrizzleComponentRepository(db);
const service = new ComponentService(repository);

startGrpcServer(service);

const httpPort = process.env.PORT ?? 4001;
Bun.serve({
  port: httpPort,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Health check at http://localhost:${httpPort}/health`);
