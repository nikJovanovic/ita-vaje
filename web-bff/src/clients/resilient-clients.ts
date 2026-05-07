import { CircuitBreaker } from "./circuit-breaker";
import type {
  AuthResponse,
  Build,
  BuildsClient,
  BuildWithComponents,
  ComponentInfo,
  PartsClient,
  UserProfile,
  UsersClient,
} from "./types";

export class ResilientPartsClient implements PartsClient {
  private breaker = new CircuitBreaker("parts");

  constructor(private inner: PartsClient) {}

  listComponents(type?: string): Promise<ComponentInfo[]> {
    return this.breaker.exec(
      () => this.inner.listComponents(type),
      () => []
    );
  }

  getComponent(id: string): Promise<ComponentInfo | null> {
    return this.breaker.exec(
      () => this.inner.getComponent(id),
      () => null
    );
  }

  getComponentsByIds(ids: string[]): Promise<ComponentInfo[]> {
    return this.breaker.exec(
      () => this.inner.getComponentsByIds(ids),
      () => []
    );
  }
}

export class ResilientBuildsClient implements BuildsClient {
  private breaker = new CircuitBreaker("builds");

  constructor(private inner: BuildsClient) {}

  listBuilds(userId?: string): Promise<Build[]> {
    return this.breaker.exec(
      () => this.inner.listBuilds(userId),
      () => []
    );
  }

  getBuild(id: string): Promise<BuildWithComponents | null> {
    return this.breaker.exec(
      () => this.inner.getBuild(id),
      () => null
    );
  }

  createBuild(
    token: string,
    body: { name: string; componentIds: string[] }
  ): Promise<Build> {
    return this.breaker.exec(() => this.inner.createBuild(token, body));
  }

  deleteBuild(token: string, id: string): Promise<boolean> {
    return this.breaker.exec(() => this.inner.deleteBuild(token, id));
  }
}

export class ResilientUsersClient implements UsersClient {
  private breaker = new CircuitBreaker("users");

  constructor(private inner: UsersClient) {}

  register(body: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.breaker.exec(() => this.inner.register(body));
  }

  login(body: { email: string; password: string }): Promise<AuthResponse> {
    return this.breaker.exec(() => this.inner.login(body));
  }

  getProfile(token: string): Promise<UserProfile | null> {
    return this.breaker.exec(
      () => this.inner.getProfile(token),
      () => null
    );
  }
}
