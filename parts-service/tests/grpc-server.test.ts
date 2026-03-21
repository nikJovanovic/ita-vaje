import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "node:path";
import postgres from "postgres";
import { ComponentService } from "../src/catalog/application/component-service";
import { DrizzleComponentRepository } from "../src/catalog/infrastructure/drizzle-component-repository";
import { startGrpcServer } from "../src/catalog/infrastructure/grpc-server";
import * as schema from "../src/catalog/infrastructure/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/catalog_db";
const pgClient = postgres(connectionString);
const db = drizzle(pgClient, { schema });
const repo = new DrizzleComponentRepository(db);
const service = new ComponentService(repo);

const GRPC_TEST_PORT = "50061";

interface ComponentInfo {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  specs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// biome-ignore lint/suspicious/noExplicitAny: gRPC dynamic client typing
type GrpcCallback = (err: grpc.ServiceError | null, response: any) => void;

interface PartsClient extends grpc.Client {
  listComponents: (request: { type?: string }, callback: GrpcCallback) => void;
  getComponent: (request: { id: string }, callback: GrpcCallback) => void;
  getComponentsByIds: (
    request: { ids: string[] },
    callback: GrpcCallback,
  ) => void;
  createComponent: (
    request: {
      name: string;
      brand: string;
      type: string;
      price: number;
      specs: Record<string, string>;
    },
    callback: GrpcCallback,
  ) => void;
  updateComponent: (
    request: {
      id: string;
      name?: string;
      brand?: string;
      type?: string;
      price?: number;
      specs?: Record<string, string>;
    },
    callback: GrpcCallback,
  ) => void;
  deleteComponent: (request: { id: string }, callback: GrpcCallback) => void;
}

let server: grpc.Server;
let client: PartsClient;

beforeAll(async () => {
  await db.execute(sql`DELETE FROM components`);

  process.env.GRPC_PORT = GRPC_TEST_PORT;
  server = startGrpcServer(service);

  await new Promise((resolve) => setTimeout(resolve, 500));

  const protoPath = resolve(import.meta.dir, "../proto/parts.proto");
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const partsProto = grpc.loadPackageDefinition(packageDefinition)
    .parts as grpc.GrpcObject;
  const PartsServiceClient =
    partsProto.PartsService as grpc.ServiceClientConstructor;

  client = new PartsServiceClient(
    `localhost:${GRPC_TEST_PORT}`,
    grpc.credentials.createInsecure(),
  ) as unknown as PartsClient;
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM components`);
});

afterAll(async () => {
  client?.close();
  server?.forceShutdown();
  await db.execute(sql`DELETE FROM components`);
  await pgClient.end();
});

// biome-ignore lint/suspicious/noExplicitAny: gRPC dynamic client methods
function rpc<T>(
  method: (...args: any[]) => void,
  request: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    method(request, (err: grpc.ServiceError | null, res: T) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

const sampleCPU = {
  name: "AMD Ryzen 7 7800X3D",
  brand: "AMD",
  type: "CPU",
  price: 349.99,
  specs: { cores: "8", threads: "16", socket: "AM5" },
};

const sampleGPU = {
  name: "NVIDIA RTX 4070",
  brand: "NVIDIA",
  type: "GPU",
  price: 599.99,
  specs: { vram: "12GB", bus: "PCIe 4.0" },
};

describe("gRPC CreateComponent", () => {
  test("creates component and returns it", async () => {
    const res = await rpc<ComponentInfo>(
      client.createComponent.bind(client),
      sampleCPU,
    );

    expect(res.id).toBeDefined();
    expect(res.name).toBe(sampleCPU.name);
    expect(res.brand).toBe(sampleCPU.brand);
    expect(res.type).toBe(sampleCPU.type);
    expect(res.specs).toEqual(sampleCPU.specs);
    expect(res.createdAt).toBeDefined();
  });
});

describe("gRPC GetComponent", () => {
  test("returns component by id", async () => {
    const created = await rpc<ComponentInfo>(
      client.createComponent.bind(client),
      sampleCPU,
    );

    const res = await rpc<ComponentInfo>(client.getComponent.bind(client), {
      id: created.id,
    });

    expect(res.id).toBe(created.id);
    expect(res.name).toBe(sampleCPU.name);
  });

  test("returns NOT_FOUND for non-existent id", async () => {
    try {
      await rpc<ComponentInfo>(client.getComponent.bind(client), {
        id: "00000000-0000-0000-0000-000000000000",
      });
      expect(true).toBe(false);
    } catch (err) {
      expect((err as grpc.ServiceError).code).toBe(grpc.status.NOT_FOUND);
    }
  });
});

describe("gRPC ListComponents", () => {
  test("returns all components", async () => {
    await rpc(client.createComponent.bind(client), sampleCPU);
    await rpc(client.createComponent.bind(client), sampleGPU);

    const res = await rpc<{ components: ComponentInfo[] }>(
      client.listComponents.bind(client),
      {},
    );

    expect(res.components.length).toBe(2);
  });

  test("filters by type", async () => {
    await rpc(client.createComponent.bind(client), sampleCPU);
    await rpc(client.createComponent.bind(client), sampleGPU);

    const res = await rpc<{ components: ComponentInfo[] }>(
      client.listComponents.bind(client),
      { type: "CPU" },
    );

    expect(res.components.length).toBe(1);
    expect(res.components[0].type).toBe("CPU");
  });
});

describe("gRPC GetComponentsByIds", () => {
  test("returns matching components", async () => {
    const cpu = await rpc<ComponentInfo>(
      client.createComponent.bind(client),
      sampleCPU,
    );
    const gpu = await rpc<ComponentInfo>(
      client.createComponent.bind(client),
      sampleGPU,
    );

    const res = await rpc<{ components: ComponentInfo[] }>(
      client.getComponentsByIds.bind(client),
      { ids: [cpu.id, gpu.id] },
    );

    expect(res.components.length).toBe(2);
  });

  test("returns empty for non-existent ids", async () => {
    const res = await rpc<{ components: ComponentInfo[] }>(
      client.getComponentsByIds.bind(client),
      { ids: ["00000000-0000-0000-0000-000000000000"] },
    );

    expect(res.components.length).toBe(0);
  });

  test("returns empty for empty ids", async () => {
    const res = await rpc<{ components: ComponentInfo[] }>(
      client.getComponentsByIds.bind(client),
      { ids: [] },
    );

    expect(res.components.length).toBe(0);
  });
});

describe("gRPC UpdateComponent", () => {
  test("updates component fields", async () => {
    const created = await rpc<ComponentInfo>(
      client.createComponent.bind(client),
      sampleCPU,
    );

    const res = await rpc<ComponentInfo>(client.updateComponent.bind(client), {
      id: created.id,
      price: 299.99,
    });

    expect(res.name).toBe(sampleCPU.name);
    expect(res.price).toBeCloseTo(299.99, 1);
  });

  test("returns NOT_FOUND for non-existent id", async () => {
    try {
      await rpc<ComponentInfo>(client.updateComponent.bind(client), {
        id: "00000000-0000-0000-0000-000000000000",
        price: 100,
      });
      expect(true).toBe(false);
    } catch (err) {
      expect((err as grpc.ServiceError).code).toBe(grpc.status.NOT_FOUND);
    }
  });
});

describe("gRPC DeleteComponent", () => {
  test("deletes component and returns success", async () => {
    const created = await rpc<ComponentInfo>(
      client.createComponent.bind(client),
      sampleCPU,
    );

    const res = await rpc<{ success: boolean }>(
      client.deleteComponent.bind(client),
      { id: created.id },
    );

    expect(res.success).toBe(true);

    try {
      await rpc(client.getComponent.bind(client), { id: created.id });
      expect(true).toBe(false);
    } catch (err) {
      expect((err as grpc.ServiceError).code).toBe(grpc.status.NOT_FOUND);
    }
  });

  test("returns NOT_FOUND for non-existent id", async () => {
    try {
      await rpc(client.deleteComponent.bind(client), {
        id: "00000000-0000-0000-0000-000000000000",
      });
      expect(true).toBe(false);
    } catch (err) {
      expect((err as grpc.ServiceError).code).toBe(grpc.status.NOT_FOUND);
    }
  });
});
