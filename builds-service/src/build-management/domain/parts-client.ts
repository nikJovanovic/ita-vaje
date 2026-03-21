import type { ComponentInfo } from "./build";

export interface PartsClient {
  getComponentsByIds(ids: string[]): Promise<ComponentInfo[]>;
}
