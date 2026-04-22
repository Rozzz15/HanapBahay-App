/**
 * Performance Logger Utility
 * Logs operations with millisecond timestamps to track slow operations
 */

interface PerfLog {
  operation: string;
  startTime: number;
}

class PerformanceLogger {
  private logs: Map<string, PerfLog> = new Map();

  /**
   * Start timing an operation
   * @param operation - Name of the operation to track
   */
  start(operation: string): void {
    const startTime = Date.now();
    this.logs.set(operation, { operation, startTime });
    console.log(`[PERF START] ${operation} - ${new Date().toISOString()}`);
  }

  /**
   * End timing an operation and log duration
   * @param operation - Name of the operation to track
   */
  end(operation: string): void {
    const log = this.logs.get(operation);
    if (!log) {
      console.warn(`[PERF WARNING] No start time found for: ${operation}`);
      return;
    }

    const duration = Date.now() - log.startTime;
    const timestamp = new Date().toISOString();
    
    // Color code by duration
    if (duration > 2000) {
      console.error(`[PERF END] ❌ SLOW ${operation} - ${duration}ms - ${timestamp}`);
    } else if (duration > 1000) {
      console.warn(`[PERF END] ⚠️ ${operation} - ${duration}ms - ${timestamp}`);
    } else if (duration > 500) {
      console.log(`[PERF END] 🟡 ${operation} - ${duration}ms - ${timestamp}`);
    } else {
      console.log(`[PERF END] ✅ ${operation} - ${duration}ms - ${timestamp}`);
    }

    this.logs.delete(operation);
  }

  /**
   * Log a checkpoint within an operation
   * @param message - Checkpoint message
   */
  checkpoint(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[PERF CHECKPOINT] ${message} - ${timestamp}`);
  }

  /**
   * Wrap an async function with performance logging
   * @param operation - Operation name
   * @param fn - Async function to execute
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation);
      return result;
    } catch (error) {
      const duration = Date.now() - (this.logs.get(operation)?.startTime || Date.now());
      console.error(`[PERF ERROR] ${operation} failed after ${duration}ms`, error);
      this.logs.delete(operation);
      throw error;
    }
  }
}

// Export singleton instance
export const perfLogger = new PerformanceLogger();

// Example usage:
// import { perfLogger } from './utils/performance-logger';
//
// // Method 1: Manual start/end
// perfLogger.start('Load Conversation');
// const data = await fetchData();
// perfLogger.checkpoint('Data fetched, loading messages');
// const messages = await fetchMessages();
// perfLogger.end('Load Conversation');
//
// // Method 2: Auto measure
// const data = await perfLogger.measure('Load Conversation', async () => {
//   return await fetchConversation(id);
// });
