import type { AuthResponse, UserProfile, UsersClient } from "./types";

export class HttpError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`HTTP ${status}: ${body}`);
    this.name = "HttpError";
  }
}

export class HttpUsersClient implements UsersClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.USERS_SERVICE_URL ?? "http://localhost:4003";
  }

  async register(body: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(res.status, text);
    }
    return (await res.json()) as AuthResponse;
  }

  async login(body: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(res.status, text);
    }
    return (await res.json()) as AuthResponse;
  }

  async getProfile(token: string): Promise<UserProfile | null> {
    const res = await fetch(`${this.baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(res.status, text);
    }
    return (await res.json()) as UserProfile;
  }
}
