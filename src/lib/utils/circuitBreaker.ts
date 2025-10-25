/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by temporarily blocking requests after repeated failures
 */

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private failures = 0;
  private lastFailure: Date | null = null;
  private state: CircuitState = 'closed';
  private readonly threshold: number;
  private readonly timeout: number;

  /**
   * @param threshold - Number of failures before opening circuit (default: 5)
   * @param timeout - Time in ms before attempting to close circuit (default: 60000)
   */
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.state === 'open') {
      // Check if enough time has passed to try again
      if (this.lastFailure && Date.now() - this.lastFailure.getTime() > this.timeout) {
        console.log('[CircuitBreaker] Transitioning to half-open state');
        this.state = 'half-open';
      } else {
        console.warn('[CircuitBreaker] Circuit is open - skipping request');
        return null;
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Reset circuit breaker on successful request
   */
  private onSuccess() {
    if (this.failures > 0) {
      console.log('[CircuitBreaker] Request succeeded - resetting failures');
    }
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Record failure and potentially open circuit
   */
  private onFailure() {
    this.failures++;
    this.lastFailure = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error(`[CircuitBreaker] Circuit opened after ${this.failures} failures`);
    } else {
      console.warn(`[CircuitBreaker] Failure ${this.failures}/${this.threshold}`);
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get current failure count
   */
  getFailures(): number {
    return this.failures;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailure = null;
    console.log('[CircuitBreaker] Manually reset');
  }
}

// Export singleton instance for Amadeus API
export const amadeusCircuitBreaker = new CircuitBreaker(5, 60000);
