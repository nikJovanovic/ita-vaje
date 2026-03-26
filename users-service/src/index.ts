import { createApp } from "./app.ts";
import { AuthService } from "./identity/application/auth-service.ts";
import type { EventBus } from "./identity/domain/event-bus.ts";
import { db } from "./identity/infrastructure/db.ts";
import { DrizzleUserRepository } from "./identity/infrastructure/drizzle-user-repository.ts";
import {
  NoopEventBus,
  RabbitMqEventBus,
} from "./identity/infrastructure/rabbitmq-event-bus.ts";

const repository = new DrizzleUserRepository(db);

let eventBus: EventBus;
try {
  const rmq = new RabbitMqEventBus();
  await rmq.connect();
  eventBus = rmq;
} catch (err) {
  console.warn(
    `[${new Date().toISOString()}] RabbitMQ not available, using NoopEventBus:`,
    err,
  );
  eventBus = new NoopEventBus();
}

const service = new AuthService(repository, eventBus);
const app = createApp(service);

const port = Number(Deno.env.get("PORT") ?? "4003");
console.log(
  `[${
    new Date().toISOString()
  }] Users service running at http://localhost:${port}`,
);
console.log(
  `[${
    new Date().toISOString()
  }] Swagger docs at http://localhost:${port}/swagger`,
);
app.listen({ port });
