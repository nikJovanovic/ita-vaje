type State = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  threshold?: number;
  resetTimeoutMs?: number;
  callTimeoutMs?: number;
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(name: string, ms: number) {
    super(`Circuit breaker '${name}' call timed out after ${ms}ms`);
    this.name = "CircuitBreakerTimeoutError";
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker '${name}' is OPEN`);
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  private failures = 0;
  private state: State = "CLOSED";
  private nextAttempt = 0;
  private readonly threshold: number;
  private readonly resetTimeoutMs: number;
  private readonly callTimeoutMs: number;

  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.threshold = options.threshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10_000;
    this.callTimeoutMs = options.callTimeoutMs ?? 3_000;
  }

  async exec<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        if (fallback) return fallback();
        throw new CircuitBreakerOpenError(this.name);
      }
      this.transition("HALF_OPEN");
    }
    try {
      const result = await this.withTimeout(fn());
      this.onSuccess();
      return result;
    } catch (err) {
      if (this.shouldCount(err)) this.onFailure();
      throw err;
    }
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    const ms = this.callTimeoutMs;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new CircuitBreakerTimeoutError(this.name, ms)),
        ms
      );
      p.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }

  getState(): State {
    return this.state;
  }

  private shouldCount(err: unknown): boolean {
    const status = (err as { status?: number })?.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return false;
    }
    return true;
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state !== "CLOSED") this.transition("CLOSED");
  }

  private onFailure() {
    this.failures++;
    if (this.state === "HALF_OPEN" || this.failures >= this.threshold) {
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
      this.transition("OPEN");
    }
  }

  private transition(next: State) {
    this.state = next;
    console.warn(
      `[circuit-breaker] ${this.name} -> ${next}${
        next === "OPEN"
          ? ` (retry after ${new Date(this.nextAttempt).toISOString()})`
          : ""
      }`
    );
  }
}
