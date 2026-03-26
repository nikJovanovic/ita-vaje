import { resolve } from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type { ComponentInfo } from "../domain/build";
import type { PartsClient } from "../domain/parts-client";

interface GetComponentsByIdsResponse {
  components: ComponentInfo[];
}

export class GrpcPartsClient implements PartsClient {
  private client: grpc.Client & {
    getComponentsByIds: (
      request: { ids: string[] },
      callback: (
        err: grpc.ServiceError | null,
        response: GetComponentsByIdsResponse,
      ) => void,
    ) => void;
  };

  constructor() {
    const protoPath =
      process.env.PARTS_PROTO_PATH ??
      resolve(import.meta.dir, "../../../../parts-service/proto/parts.proto");

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
      grpc.credentials.createInsecure(),
    ) as unknown as typeof this.client;
  }

  getComponentsByIds(ids: string[]): Promise<ComponentInfo[]> {
    return new Promise((resolve, reject) => {
      this.client.getComponentsByIds({ ids }, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response.components);
      });
    });
  }
}
