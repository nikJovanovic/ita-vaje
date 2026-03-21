import type {
  Build,
  BuildWithComponents,
  CreateBuildInput,
} from "../domain/build";
import type { BuildRepository } from "../domain/build-repository";
import type { PartsClient } from "../domain/parts-client";

export class BuildService {
  constructor(
    private repository: BuildRepository,
    private partsClient: PartsClient,
  ) {}

  findAll(userId?: string): Promise<Build[]> {
    return this.repository.findAll(userId);
  }

  async findById(id: string): Promise<BuildWithComponents | null> {
    const build = await this.repository.findById(id);
    if (!build) return null;

    try {
      const components = await this.partsClient.getComponentsByIds(
        build.componentIds,
      );
      const totalPrice = components.reduce((sum, c) => sum + c.price, 0);
      return { ...build, components, totalPrice };
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] gRPC ERROR: failed to fetch components for build ${id}`,
        err,
      );
      return { ...build, components: [], totalPrice: 0 };
    }
  }

  create(input: CreateBuildInput): Promise<Build> {
    return this.repository.create(input);
  }

  delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
