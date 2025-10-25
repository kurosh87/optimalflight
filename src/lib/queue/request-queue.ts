/**
 * Request Queue for External API Calls
 *
 * Limits concurrent requests to prevent overloading external APIs
 * Configuration: Max 10 concurrent requests, 30 requests per minute
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private readonly maxConcurrent: number;
  private readonly maxPerInterval: number;
  private readonly intervalMs: number;
  private requestTimestamps: number[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxConcurrent = 10, maxPerInterval = 30, intervalMs = 60000) {
    this.maxConcurrent = maxConcurrent;
    this.maxPerInterval = maxPerInterval;
    this.intervalMs = intervalMs;

    // Clean up old timestamps every 10 seconds
    // IMPORTANT: Only create interval once to prevent memory leaks
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupTimestamps();
      }, 10000);
    }
  }

  /**
   * Add request to queue
   */
  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more requests
    while (
      this.queue.length > 0 &&
      this.activeRequests < this.maxConcurrent &&
      this.canMakeRequest()
    ) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      this.requestTimestamps.push(Date.now());

      // Execute request
      request
        .execute()
        .then(result => {
          request.resolve(result);
        })
        .catch(error => {
          request.reject(error);
        })
        .finally(() => {
          this.activeRequests--;
          this.processQueue(); // Process next request
        });
    }
  }

  /**
   * Check if we can make a request based on rate limits
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.intervalMs
    );

    return recentRequests.length < this.maxPerInterval;
  }

  /**
   * Clean up old request timestamps
   */
  private cleanupTimestamps(): void {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.intervalMs
    );
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    activeRequests: number;
    recentRequests: number;
  } {
    const now = Date.now();
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      recentRequests: this.requestTimestamps.filter(
        t => now - t < this.intervalMs
      ).length,
    };
  }

  /**
   * Clear queue (for shutdown/cleanup)
   */
  clear(): void {
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Destroy queue (cleanup resources)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    this.requestTimestamps = [];
  }
}

// Singleton instance for Kiwi API requests
export const kiwiApiQueue = new RequestQueue(
  10,  // Max 10 concurrent requests
  30,  // Max 30 requests
  60000 // per minute
);

/**
 * Wrapper to execute function through queue
 */
export async function queuedRequest<T>(execute: () => Promise<T>): Promise<T> {
  return kiwiApiQueue.enqueue(execute);
}
