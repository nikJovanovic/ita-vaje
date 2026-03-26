import { from, map, type Observable, of, switchMap, throwError } from "rxjs";
import type { EventBus } from "../domain/event-bus.ts";
import type { UserProfile } from "../domain/user.ts";
import type { UserRepository } from "../domain/user-repository.ts";
import { signJwt } from "./jwt.ts";
import { hashPassword, verifyPassword } from "./password.ts";

function toProfile(user: {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}): UserProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  constructor(
    private repository: UserRepository,
    private eventBus: EventBus,
  ) {}

  register(input: {
    email: string;
    username: string;
    password: string;
  }): Observable<{ user: UserProfile; token: string }> {
    return from(this.repository.findByEmail(input.email)).pipe(
      switchMap((existing) => {
        if (existing) {
          return throwError(() => new Error("Email already registered"));
        }
        return from(hashPassword(input.password));
      }),
      switchMap((passwordHash) =>
        from(
          this.repository.create({
            email: input.email,
            username: input.username,
            passwordHash,
          }),
        )
      ),
      switchMap((user) =>
        from(signJwt({ sub: user.id, email: user.email })).pipe(
          map((token) => ({ user: toProfile(user), token })),
        )
      ),
      switchMap((result) =>
        from(
          this.eventBus.publish("user.registered", {
            userId: result.user.id,
            email: result.user.email,
            username: result.user.username,
          }),
        ).pipe(map(() => result))
      ),
    );
  }

  login(input: {
    email: string;
    password: string;
  }): Observable<{ user: UserProfile; token: string }> {
    return from(this.repository.findByEmail(input.email)).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => new Error("Invalid credentials"));
        }
        return from(verifyPassword(input.password, user.passwordHash)).pipe(
          switchMap((valid) => {
            if (!valid) {
              return throwError(() => new Error("Invalid credentials"));
            }
            return from(signJwt({ sub: user.id, email: user.email })).pipe(
              map((token) => ({ user: toProfile(user), token })),
            );
          }),
        );
      }),
      switchMap((result) =>
        from(
          this.eventBus.publish("user.loggedIn", {
            userId: result.user.id,
          }),
        ).pipe(map(() => result))
      ),
    );
  }

  getProfile(userId: string): Observable<UserProfile> {
    return from(this.repository.findById(userId)).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => new Error("User not found"));
        }
        return of(toProfile(user));
      }),
    );
  }
}
