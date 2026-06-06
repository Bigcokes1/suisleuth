export const RPC_TIMEOUT_MS = 8_000;

export class RpcTimeoutError extends Error {
  constructor(method: string) {
    super(`RPC timeout (${method})`);
    this.name = "RpcTimeoutError";
  }
}

export async function withRpcTimeout<T>(
  promise: Promise<T>,
  method: string,
  fallback?: T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new RpcTimeoutError(method)), RPC_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof RpcTimeoutError && fallback !== undefined) {
      return fallback;
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
