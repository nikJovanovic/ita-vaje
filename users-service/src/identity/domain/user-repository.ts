import type { User } from "./user.ts";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User>;
}
