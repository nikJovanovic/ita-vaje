import type { Build, CreateBuildInput } from "./build";

export interface BuildRepository {
  findAll(userId?: string): Promise<Build[]>;
  findById(id: string): Promise<Build | null>;
  create(input: CreateBuildInput): Promise<Build>;
  delete(id: string): Promise<boolean>;
}
