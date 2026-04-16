export interface ComponentInfo {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  specs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Build {
  id: string;
  name: string;
  userId: string;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BuildWithComponents extends Build {
  components: ComponentInfo[];
  totalPrice: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface PartsClient {
  listComponents(type?: string): Promise<ComponentInfo[]>;
  getComponent(id: string): Promise<ComponentInfo | null>;
  getComponentsByIds(ids: string[]): Promise<ComponentInfo[]>;
}

export interface BuildsClient {
  listBuilds(userId?: string): Promise<Build[]>;
  getBuild(id: string): Promise<BuildWithComponents | null>;
  createBuild(
    token: string,
    body: { name: string; componentIds: string[] }
  ): Promise<Build>;
  deleteBuild(token: string, id: string): Promise<boolean>;
}

export interface UsersClient {
  register(body: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse>;
  login(body: { email: string; password: string }): Promise<AuthResponse>;
  getProfile(token: string): Promise<UserProfile | null>;
}
