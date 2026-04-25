/**
 * TiDB Transient Error Retry Utility
 *
 * TiDB (the database used in this project) occasionally throws transient
 * "Information schema is out of date" errors when TiKV schema sync lags.
 * These are safe to retry with a short backoff.
 *
 * Usage:
 *   import { withDbRetry } from "./db-retry";
 *   const result = await withDbRetry(() => db.insert(...), "createOrder");
 */

/** Pause execution for `ms` milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Walk the error cause chain looking for a retryable TiDB message */
export function isRetryableDbError(error: unknown): boolean {
  const RETRYABLE = [
    "information schema is out of date",
    "schema failed to update",
    "try again",
    "deadlock",
    "lock wait timeout",
    "pd server timeout",
    "tikv server timeout",
    "tidb server timeout",
    "region is unavailable",
    "hy000",
    "connection lost",
    "econnreset",
    "econnrefused",
    "etimedout",
    "tiproxy fails to connect",
    "tidb server is busy",
    "server is overloaded",
  ];
  const check = (e: unknown): boolean => {
    if (!e || typeof e !== "object") return false;
    const err = e as { sqlMessage?: string; message?: string; cause?: unknown };
    const text = (err.sqlMessage ?? err.message ?? "").toLowerCase();
    if (RETRYABLE.some((s) => text.includes(s))) return true;
    if (err.cause) return check(err.cause);
    return false;
  };
  return check(error);
}

/**
 * Execute `fn` with automatic retry on transient TiDB errors.
 *
 * @param fn        - Async function to execute (must be idempotent or safe to retry)
 * @param label     - Human-readable label for log messages (e.g. "createOrder")
 * @param maxRetries - Maximum number of attempts (default: 3)
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 5
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < maxRetries && isRetryableDbError(error)) {
        const delay = Math.min(attempt * 1500, 6000); // 1.5s, 3s, 4.5s, 6s
        console.warn(
          `[DB] ${label} transient error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  // TypeScript requires an explicit throw here even though the loop always returns or throws
  throw new Error(`[DB] ${label} failed after ${maxRetries} attempts`);
}
