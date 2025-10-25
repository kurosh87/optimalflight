/**
 * Initialize background jobs
 * This should be called once when the application starts
 */

let initialized = false;

export async function initializeBackgroundJobs() {
  // Only initialize once
  if (initialized) {
    return;
  }

  // Only run in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_BACKGROUND_JOBS !== 'true') {
    console.log('[Jobs] Background jobs disabled in development. Set ENABLE_BACKGROUND_JOBS=true to enable.');
    return;
  }

  try {
    const { startAllJobs } = await import('@/jobs');
    startAllJobs();
    initialized = true;
  } catch (error) {
    console.error('[Jobs] Failed to initialize background jobs:', error);
  }
}
