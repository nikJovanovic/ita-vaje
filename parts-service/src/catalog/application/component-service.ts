import type {
  Component,
  ComponentType,
  CreateComponentInput,
  UpdateComponentInput,
} from "../domain/component";
import type { ComponentRepository } from "../domain/component-repository";

export class ComponentService {
  constructor(private repository: ComponentRepository) {}

  findAll(type?: ComponentType): Promise<Component[]> {
    return this.repository.findAll(type);
  }

  findById(id: string): Promise<Component | null> {
    return this.repository.findById(id);
  }

  findByIds(ids: string[]): Promise<Component[]> {
    return this.repository.findByIds(ids);
  }

  create(input: CreateComponentInput): Promise<Component> {
    return this.repository.create(input);
  }

  update(id: string, input: UpdateComponentInput): Promise<Component | null> {
    return this.repository.update(id, input);
  }

  delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
