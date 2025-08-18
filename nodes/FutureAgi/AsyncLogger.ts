// Removed axios import - using n8n's built-in httpRequest helper instead

import { safeError, safeWarn } from "./helper";

export interface LogEntry {
	executionId: string;
	promptName: string;
	inputData: any;
	outputData: any;
	metadata: any;
	timestamp: string;
	retryCount?: number;
}

export interface LoggerConfig {
	baseUrl: string;
    apiKey: string;
    secretKey: string;
	batchSize: number;
	maxRetries: number;
	httpRequest: (options: any) => Promise<any>; // n8n's httpRequest helper
}

export class AsyncLogger {
	private config: LoggerConfig;
	private logQueue: LogEntry[] = [];
	private isProcessing = false;

	constructor(config: LoggerConfig) {
		this.config = config;
		this.startFlushTimer();
	}

	/**
	 * Add a log entry to the queue for async processing
	 */
	public async log(entry: LogEntry): Promise<void> {
		entry.timestamp = entry.timestamp || new Date().toISOString();
		entry.retryCount = 0;
		
		this.logQueue.push(entry);
		
		// If queue is full, flush immediately
		if (this.logQueue.length >= this.config.batchSize) {
			await this.flush();
		}
	}

	/**
	 * Flush all pending log entries
	 */
	public async flush(): Promise<void> {
		if (this.isProcessing || this.logQueue.length === 0) {
			return;
		}

		this.isProcessing = true;
		const batch = this.logQueue.splice(0, this.config.batchSize);

		try {
			await this.sendBatch(batch);
        } catch (error) {
            safeWarn('Failed to send log batch:', (error as any).message);
			// Re-queue failed entries for retry
			this.requeueWithRetry(batch);
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Send a batch of log entries to Future AGI
	 */
	private async sendBatch(batch: LogEntry[]): Promise<void> {
        const headers = {
            'X-Api-Key': this.config.apiKey,
            'X-Secret-Key': this.config.secretKey,
            'Content-Type': 'application/json',
        } as Record<string, string>;

		const payload = {
			entries: batch,
			batchId: this.generateBatchId(),
			timestamp: new Date().toISOString(),
		};

        await this.config.httpRequest({
            method: 'POST',
            url: `${this.config.baseUrl}/sdk/api/v1/log/event/`,
			headers,
			body: payload,
			json: true,
			// timeout intentionally omitted to use default behavior
		});
	}

	/**
	 * Re-queue failed entries with retry logic
	 */
	private requeueWithRetry(batch: LogEntry[]): void {
		for (const entry of batch) {
			entry.retryCount = (entry.retryCount || 0) + 1;
			
			if (entry.retryCount <= this.config.maxRetries) {
				// Re-queue immediately without delay
				this.logQueue.unshift(entry);
			} else {
                safeError('Max retries exceeded for log entry:', entry.executionId);
			}
		}
	}

	/**
	 * Start the periodic flush timer (removed interval flushing)
	 */
	private startFlushTimer(): void {
		// Removed automatic flushing - flush on demand when queue is full
	}

	/**
	 * Stop the logger and flush remaining entries
	 */
	public async stop(): Promise<void> {
		// Removed timer cleanup since we don't use intervals anymore
		await this.flush();
	}

	/**
	 * Generate a unique batch ID
	 */
	private generateBatchId(): string {
		return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}

	/**
	 * Get current queue status
	 */
	public getStatus(): { queueSize: number; isProcessing: boolean } {
		return {
			queueSize: this.logQueue.length,
			isProcessing: this.isProcessing,
		};
	}
}

// Singleton logger instance
let loggerInstance: AsyncLogger | null = null;

/**
 * Get or create the global logger instance
 */
export function getLogger(config?: LoggerConfig): AsyncLogger {
	if (!loggerInstance && config) {
		loggerInstance = new AsyncLogger(config);
	}
	
	if (!loggerInstance) {
		throw new Error('Logger not initialized. Please provide config on first call.');
	}
	
	return loggerInstance;
}

/**
 * Initialize the global logger
 */
export function initializeLogger(config: LoggerConfig): AsyncLogger {
	if (loggerInstance) {
		loggerInstance.stop();
	}
	
	loggerInstance = new AsyncLogger(config);
	return loggerInstance;
}