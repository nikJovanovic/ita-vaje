export interface EventBus {
  publish(event: string, payload: unknown): Promise<void>;
}
