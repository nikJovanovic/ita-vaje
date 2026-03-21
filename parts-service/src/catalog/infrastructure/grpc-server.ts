import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ReflectionService } from "@grpc/reflection";
import { resolve } from "node:path";
import type { ComponentService } from "../application/component-service";
import type {
  ComponentType,
  CreateComponentInput,
  UpdateComponentInput,
} from "../domain/component";

const PROTO_PATH = resolve(import.meta.dir, "../../../proto/parts.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const partsProto = grpc.loadPackageDefinition(packageDefinition)
  .parts as grpc.GrpcObject;

function log(rpc: string, status: string, durationMs: number) {
  console.log(
    `[${new Date().toISOString()}] gRPC ${rpc} ${status} ${durationMs}ms`,
  );
}

export function startGrpcServer(service: ComponentService): grpc.Server {
  const server = new grpc.Server();

  const reflection = new ReflectionService(packageDefinition);
  reflection.addToServer(server);

  const serviceDefinition = (
    partsProto.PartsService as grpc.ServiceClientConstructor
  ).service;

  server.addService(serviceDefinition, {
    listComponents: async (
      call: grpc.ServerUnaryCall<{ type?: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>,
    ) => {
      const start = Date.now();
      try {
        const type = call.request.type || undefined;
        const components = await service.findAll(type as ComponentType);
        const mapped = components.map(mapComponent);
        log("ListComponents", "OK", Date.now() - start);
        callback(null, { components: mapped });
      } catch (err) {
        log("ListComponents", "ERROR", Date.now() - start);
        console.error(err);
        callback({
          code: grpc.status.INTERNAL,
          message: "Internal server error",
        });
      }
    },

    getComponent: async (
      call: grpc.ServerUnaryCall<{ id: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>,
    ) => {
      const start = Date.now();
      try {
        const component = await service.findById(call.request.id);
        if (!component) {
          log("GetComponent", "NOT_FOUND", Date.now() - start);
          callback({
            code: grpc.status.NOT_FOUND,
            message: "Component not found",
          });
          return;
        }
        log("GetComponent", "OK", Date.now() - start);
        callback(null, mapComponent(component));
      } catch (err) {
        log("GetComponent", "ERROR", Date.now() - start);
        console.error(err);
        callback({
          code: grpc.status.INTERNAL,
          message: "Internal server error",
        });
      }
    },

    getComponentsByIds: async (
      call: grpc.ServerUnaryCall<{ ids: string[] }, unknown>,
      callback: grpc.sendUnaryData<unknown>,
    ) => {
      const start = Date.now();
      try {
        const components = await service.findByIds(call.request.ids);
        const mapped = components.map(mapComponent);
        log("GetComponentsByIds", "OK", Date.now() - start);
        callback(null, { components: mapped });
      } catch (err) {
        log("GetComponentsByIds", "ERROR", Date.now() - start);
        console.error(err);
        callback({
          code: grpc.status.INTERNAL,
          message: "Internal server error",
        });
      }
    },

    createComponent: async (
      call: grpc.ServerUnaryCall<CreateComponentInput, unknown>,
      callback: grpc.sendUnaryData<unknown>,
    ) => {
      const start = Date.now();
      try {
        const input = call.request;
        const component = await service.create({
          name: input.name,
          brand: input.brand,
          type: input.type as ComponentType,
          price: input.price,
          specs: input.specs as Record<string, string>,
        });
        log("CreateComponent", "OK", Date.now() - start);
        callback(null, mapComponent(component));
      } catch (err) {
        log("CreateComponent", "ERROR", Date.now() - start);
        console.error(err);
        callback({
          code: grpc.status.INTERNAL,
          message: "Internal server error",
        });
      }
    },

    updateComponent: async (
      call: grpc.ServerUnaryCall<
        { id: string } & Partial<CreateComponentInput>,
        unknown
      >,
      callback: grpc.sendUnaryData<unknown>,
    ) => {
      const start = Date.now();
      try {
        const { id, ...fields } = call.request;
        const input: UpdateComponentInput = {};
        if (fields.name) input.name = fields.name;
        if (fields.brand) input.brand = fields.brand;
        if (fields.type) input.type = fields.type as ComponentType;
        if (fields.price) input.price = fields.price;
        if (fields.specs && Object.keys(fields.specs).length > 0) {
          input.specs = fields.specs as Record<string, string>;
        }

        const component = await service.update(id, input);
        if (!component) {
          log("UpdateComponent", "NOT_FOUND", Date.now() - start);
          callback({
            code: grpc.status.NOT_FOUND,
            message: "Component not found",
          });
          return;
        }
        log("UpdateComponent", "OK", Date.now() - start);
        callback(null, mapComponent(component));
      } catch (err) {
        log("UpdateComponent", "ERROR", Date.now() - start);
        console.error(err);
        callback({
          code: grpc.status.INTERNAL,
          message: "Internal server error",
        });
      }
    },

    deleteComponent: async (
      call: grpc.ServerUnaryCall<{ id: string }, unknown>,
      callback: grpc.sendUnaryData<unknown>,
    ) => {
      const start = Date.now();
      try {
        const success = await service.delete(call.request.id);
        if (!success) {
          log("DeleteComponent", "NOT_FOUND", Date.now() - start);
          callback({
            code: grpc.status.NOT_FOUND,
            message: "Component not found",
          });
          return;
        }
        log("DeleteComponent", "OK", Date.now() - start);
        callback(null, { success: true });
      } catch (err) {
        log("DeleteComponent", "ERROR", Date.now() - start);
        console.error(err);
        callback({
          code: grpc.status.INTERNAL,
          message: "Internal server error",
        });
      }
    },
  });

  const port = process.env.GRPC_PORT ?? "50051";
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error("Failed to start gRPC server:", err);
        return;
      }
      console.log(`gRPC server running on port ${boundPort}`);
    },
  );

  return server;
}

function mapComponent(c: {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  specs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: c.id,
    name: c.name,
    brand: c.brand,
    type: c.type,
    price: c.price,
    specs: c.specs,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
