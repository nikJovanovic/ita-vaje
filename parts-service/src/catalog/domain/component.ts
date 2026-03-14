export const COMPONENT_TYPES = [
  "CPU",
  "GPU",
  "RAM",
  "Storage",
  "Motherboard",
  "PSU",
  "Case",
  "Cooling",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

export interface Component {
  id: string;
  name: string;
  brand: string;
  type: ComponentType;
  price: number;
  specs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComponentInput {
  name: string;
  brand: string;
  type: ComponentType;
  price: number;
  specs: Record<string, string>;
}

export interface UpdateComponentInput {
  name?: string;
  brand?: string;
  type?: ComponentType;
  price?: number;
  specs?: Record<string, string>;
}
