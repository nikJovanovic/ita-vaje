export interface Build {
  id: string;
  name: string;
  userId: string;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildInput {
  name: string;
  userId: string;
  componentIds: string[];
}

export interface ComponentInfo {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
}

export interface BuildWithComponents extends Build {
  components: ComponentInfo[];
  totalPrice: number;
}
