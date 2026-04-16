import { resolve } from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type { ComponentInfo, PartsClient } from "./types";

interface ListResponse {
  components: ComponentInfo[];
}

interface GrpcClient extends grpc.Client {
  listComponents: (
    request: { type?: string },
    callback: (err: grpc.ServiceError | null, response: ListResponse) => void
  ) => void;
  getComponent: (
    request: { id: string },
    callback: (err: grpc.ServiceError | null, response: ComponentInfo) => void
  ) => void;
  getComponentsByIds: (
    request: { ids: string[] },
    callback: (err: grpc.ServiceError | null, response: ListResponse) => void
  ) => void;
}

export class GrpcPartsClient implements PartsClient {
  private client: GrpcClient;

  constructor() {
    const protoPath =
      process.env.PARTS_PROTO_PATH ??
      resolve(import.meta.dir, "../../../parts-service/proto/parts.proto");

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

    const host = process.env.PARTS_GRPC_HOST ?? "localhost:50051";
    this.client = new PartsServiceClient(
      host,
      grpc.credentials.createInsecure()
    ) as unknown as GrpcClient;
  }

  listComponents(type?: string): Promise<ComponentInfo[]> {
    return new Promise((resolvePromise, reject) => {
      const request = type ? { type } : {};
      this.client.listComponents(request, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolvePromise(response.components);
      });
    });
  }

  getComponent(id: string): Promise<ComponentInfo | null> {
    return new Promise((resolvePromise, reject) => {
      this.client.getComponent({ id }, (err, response) => {
        if (err) {
          if (err.code === grpc.status.NOT_FOUND) {
            resolvePromise(null);
            return;
          }
          reject(err);
          return;
        }
        resolvePromise(response);
      });
    });
  }

  getComponentsByIds(ids: string[]): Promise<ComponentInfo[]> {
    return new Promise((resolvePromise, reject) => {
      this.client.getComponentsByIds({ ids }, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolvePromise(response.components);
      });
    });
  }
}
