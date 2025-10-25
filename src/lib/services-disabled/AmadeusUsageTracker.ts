/**
 * Amadeus API Usage Tracker
 * Monitors API usage to stay within free quota and track costs
 */

export class AmadeusUsageTracker {
  private requestCount = 0;
  private lastReset = new Date();
  private readonly FREE_MONTHLY_QUOTA = 10000;
  private readonly COST_PER_REQUEST = 0.0008; // €0.0008 per request

  /**
   * Track a new API request
   */
  async trackRequest(endpoint?: string) {
    this.requestCount++;

    // Reset counter monthly
    const now = new Date();
    if (now.getMonth() !== this.lastReset.getMonth() ||
        now.getFullYear() !== this.lastReset.getFullYear()) {
      console.log(
        `[AmadeusUsage] Monthly usage report: ${this.requestCount} requests ` +
        `(${this.getUsagePercentage()}% of free quota)`
      );

      if (this.requestCount > this.FREE_MONTHLY_QUOTA) {
        const overage = this.requestCount - this.FREE_MONTHLY_QUOTA;
        const cost = overage * this.COST_PER_REQUEST;
        console.log(
          `[AmadeusUsage] Overage: ${overage} requests @ €${cost.toFixed(2)}`
        );
      }

      this.requestCount = 0;
      this.lastReset = now;
    }

    // Warning at 80% of free quota
    if (this.requestCount === Math.floor(this.FREE_MONTHLY_QUOTA * 0.8)) {
      console.warn(
        `⚠️  [AmadeusUsage] 80% quota warning: ${this.requestCount}/${this.FREE_MONTHLY_QUOTA} requests used`
      );
    }

    // Warning at 95% of free quota
    if (this.requestCount === Math.floor(this.FREE_MONTHLY_QUOTA * 0.95)) {
      console.warn(
        `🚨 [AmadeusUsage] 95% quota warning: ${this.requestCount}/${this.FREE_MONTHLY_QUOTA} requests used`
      );
    }

    // Alert when exceeding free quota
    if (this.requestCount === this.FREE_MONTHLY_QUOTA + 1) {
      console.error(
        `💰 [AmadeusUsage] FREE QUOTA EXCEEDED! Now incurring charges at €${this.COST_PER_REQUEST} per request`
      );
    }

    // Log every 1000 requests for tracking
    if (this.requestCount % 1000 === 0) {
      console.log(
        `[AmadeusUsage] Milestone: ${this.requestCount} requests (${this.getUsagePercentage()}%)`
      );
    }
  }

  /**
   * Get current usage statistics
   */
  getUsage() {
    const percentage = this.getUsagePercentage();
    const remaining = Math.max(0, this.FREE_MONTHLY_QUOTA - this.requestCount);
    const overage = Math.max(0, this.requestCount - this.FREE_MONTHLY_QUOTA);
    const estimatedCost = overage * this.COST_PER_REQUEST;

    return {
      count: this.requestCount,
      quota: this.FREE_MONTHLY_QUOTA,
      percentage,
      remaining,
      overage,
      estimatedCostEur: estimatedCost,
      estimatedCostUsd: estimatedCost * 1.1, // Approximate conversion
      lastReset: this.lastReset,
    };
  }

  /**
   * Get usage percentage
   */
  private getUsagePercentage(): number {
    return Math.round((this.requestCount / this.FREE_MONTHLY_QUOTA) * 100);
  }

  /**
   * Manually reset usage counter (for testing)
   */
  reset() {
    console.log(`[AmadeusUsage] Manual reset. Previous count: ${this.requestCount}`);
    this.requestCount = 0;
    this.lastReset = new Date();
  }

  /**
   * Check if we're approaching quota limits
   */
  shouldThrottle(): boolean {
    // Start throttling at 90% of quota
    return this.requestCount >= this.FREE_MONTHLY_QUOTA * 0.9;
  }

  /**
   * Get recommended polling interval based on usage
   */
  getRecommendedInterval(): number {
    const usage = this.getUsage();

    // If under 50% quota: use aggressive polling (2 min)
    if (usage.percentage < 50) {
      return 2 * 60 * 1000; // 2 minutes
    }

    // If 50-80% quota: use moderate polling (15 min)
    if (usage.percentage < 80) {
      return 15 * 60 * 1000; // 15 minutes
    }

    // If 80-95% quota: use conservative polling (30 min)
    if (usage.percentage < 95) {
      return 30 * 60 * 1000; // 30 minutes
    }

    // If >95% quota: use minimal polling (60 min)
    return 60 * 60 * 1000; // 60 minutes
  }

  /**
   * Log detailed usage report
   */
  logUsageReport() {
    const usage = this.getUsage();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Amadeus API Usage Report');
    console.log('='.repeat(50));
    console.log(`Requests this month: ${usage.count}`);
    console.log(`Free quota: ${usage.quota}`);
    console.log(`Usage: ${usage.percentage}%`);
    console.log(`Remaining: ${usage.remaining} requests`);

    if (usage.overage > 0) {
      console.log(`\n💰 BILLING ACTIVE:`);
      console.log(`Overage: ${usage.overage} requests`);
      console.log(`Estimated cost: €${usage.estimatedCostEur.toFixed(2)} / $${usage.estimatedCostUsd.toFixed(2)}`);
    }

    console.log(`\nLast reset: ${usage.lastReset.toISOString()}`);
    console.log(`Recommended interval: ${usage.count > 0 ? Math.round(this.getRecommendedInterval() / 60000) : 2} minutes`);
    console.log('='.repeat(50) + '\n');
  }
}

// Export singleton instance
export const amadeusUsageTracker = new AmadeusUsageTracker();
