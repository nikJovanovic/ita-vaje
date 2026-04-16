import type { Build, BuildWithComponents, BuildsClient } from "./types";

export class HttpBuildsClient implements BuildsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BUILDS_SERVICE_URL ?? "http://localhost:4002";
  }

  async listBuilds(userId?: string): Promise<Build[]> {
    const url = new URL("/builds", this.baseUrl);
    if (userId) url.searchParams.set("userId", userId);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to list builds: ${res.status}`);
    return (await res.json()) as Build[];
  }

  async getBuild(id: string): Promise<BuildWithComponents | null> {
    const res = await fetch(`${this.baseUrl}/builds/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get build: ${res.status}`);
    return (await res.json()) as BuildWithComponents;
  }

  async createBuild(
    token: string,
    body: { name: string; componentIds: string[] }
  ): Promise<Build> {
    const res = await fetch(`${this.baseUrl}/builds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create build: ${res.status} ${text}`);
    }
    return (await res.json()) as Build;
  }

  async deleteBuild(token: string, id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/builds/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`Failed to delete build: ${res.status}`);
    return true;
  }
}
