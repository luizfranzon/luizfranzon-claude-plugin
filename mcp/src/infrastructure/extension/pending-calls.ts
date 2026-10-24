import { AppError } from "../../shared/errors";

interface Settler {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

export interface RegisteredCall {
  id: number;
  promise: Promise<unknown>;
}

export class PendingCalls {
  private readonly calls = new Map<number, Settler>();
  private nextId = 0;

  register(method: string, timeoutMs: number): RegisteredCall {
    const id = ++this.nextId;
    const promise = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.calls.delete(id);
        reject(new AppError(`A extensão não respondeu "${method}" em ${timeoutMs / 1000}s.`));
      }, timeoutMs);
      this.calls.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
    return { id, promise };
  }

  settle(id: number, result: unknown, error?: string): void {
    const call = this.calls.get(id);
    if (!call) return;
    this.calls.delete(id);
    if (error === undefined) {
      call.resolve(result);
      return;
    }
    call.reject(new AppError(error));
  }

  rejectAll(error: Error): void {
    for (const call of this.calls.values()) call.reject(error);
    this.calls.clear();
  }
}
