import { Buffer } from "node:buffer";
import amqplib from "amqplib";
import type { EventBus } from "../domain/event-bus.ts";

export class RabbitMqEventBus implements EventBus {
  private channel: amqplib.Channel | null = null;
  private exchange = "users-events";

  async connect(retries = 5, delayMs = 3000): Promise<void> {
    const url = Deno.env.get("RABBITMQ_URL") ??
      "amqp://guest:guest@localhost:5672";

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const connection = await amqplib.connect(url);

        connection.on("error", (err: Error) => {
          console.error(
            `[${new Date().toISOString()}] RabbitMQ connection error:`,
            err.message,
          );
          this.channel = null;
        });
        connection.on("close", () => {
          console.warn(
            `[${new Date().toISOString()}] RabbitMQ connection closed`,
          );
          this.channel = null;
        });

        this.channel = await connection.createChannel();

        this.channel.on("error", (err: Error) => {
          console.error(
            `[${new Date().toISOString()}] RabbitMQ channel error:`,
            err.message,
          );
          this.channel = null;
        });
        this.channel.on("close", () => {
          this.channel = null;
        });

        await this.channel.assertExchange(this.exchange, "topic", {
          durable: true,
        });
        console.log(
          `[${
            new Date().toISOString()
          }] Connected to RabbitMQ exchange: ${this.exchange}`,
        );
        return;
      } catch (err) {
        if (attempt === retries) throw err;
        console.log(
          `[${
            new Date().toISOString()
          }] RabbitMQ not ready, retrying in ${delayMs}ms (${attempt}/${retries})`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  publish(event: string, payload: unknown): Promise<void> {
    if (!this.channel) {
      console.warn(
        `[${
          new Date().toISOString()
        }] RabbitMQ not connected, skipping event: ${event}`,
      );
      return Promise.resolve();
    }
    try {
      this.channel.publish(
        this.exchange,
        event,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );
      console.log(`[${new Date().toISOString()}] Published event: ${event}`);
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] Failed to publish event ${event}:`,
        err instanceof Error ? err.message : err,
      );
      this.channel = null;
    }
    return Promise.resolve();
  }
}

export class NoopEventBus implements EventBus {
  async publish(_event: string, _payload: unknown): Promise<void> {}
}
