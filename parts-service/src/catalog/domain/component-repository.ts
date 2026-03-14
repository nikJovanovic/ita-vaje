import type {
  Component,
  ComponentType,
  CreateComponentInput,
  UpdateComponentInput,
} from "./component";

export interface ComponentRepository {
  findAll(type?: ComponentType): Promise<Component[]>;
  findById(id: string): Promise<Component | null>;
  create(input: CreateComponentInput): Promise<Component>;
  update(id: string, input: UpdateComponentInput): Promise<Component | null>;
  delete(id: string): Promise<boolean>;
}
