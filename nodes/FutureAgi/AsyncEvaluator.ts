// Removed axios import - using n8n's built-in httpRequest helper instead

import { safeError, safeLog, safeWarn } from "./helper";

export interface EvaluationRequest {
	evaluationId: string;
	evaluationName: string;
	executionId: string;
	config: EvaluationConfig;
	timestamp: string;
	retryCount?: number;
}

export interface EvaluationConfig {
	type: 'quality' | 'safety' | 'performance' | 'custom';
	criteria: Record<string, any>;
	thresholds?: Record<string, number>;
	model?: string;
	timeout?: number;
	metadata?: Record<string, any>;
}

export interface EvaluationResult {
	evaluationId: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	score?: number;
	details?: Record<string, any>;
	metrics?: Record<string, number>;
	timestamp: string;
	duration?: number;
	error?: string;
}

export interface EvaluatorConfig {
	baseUrl: string;
    apiKey: string;
    secretKey: string;
	batchSize: number;
	maxRetries: number;
	defaultTimeout: number;
	httpRequest: (options: any) => Promise<any>; // n8n's httpRequest helper
}

export class AsyncEvaluator {
	private config: EvaluatorConfig;
	private evaluationQueue: EvaluationRequest[] = [];
	private pendingEvaluations: Map<string, EvaluationRequest> = new Map();
	private isProcessing = false;

	constructor(config: EvaluatorConfig) {
		this.config = config;
		this.startPolling();
	}

	/**
	 * Submit an evaluation request for async processing
	 */
	public async submitEvaluation(request: Omit<EvaluationRequest, 'evaluationId' | 'timestamp' | 'retryCount'>): Promise<string> {
		const evaluationId = this.generateEvaluationId();
		const fullRequest: EvaluationRequest = {
			...request,
			evaluationId,
			timestamp: new Date().toISOString(),
			retryCount: 0,
		};

		this.evaluationQueue.push(fullRequest);
		
		// Process immediately if queue is full
		if (this.evaluationQueue.length >= this.config.batchSize) {
			await this.processQueue();
		}

		return evaluationId;
	}

	/**
	 * Submit evaluation and wait for result (synchronous)
	 */
	public async submitEvaluationSync(request: Omit<EvaluationRequest, 'evaluationId' | 'timestamp' | 'retryCount'>): Promise<EvaluationResult> {
		const evaluationId = await this.submitEvaluation(request);
		
		// Wait for result with timeout
		const timeout = request.config.timeout || this.config.defaultTimeout;
		const startTime = Date.now();
		
		while (Date.now() - startTime < timeout) {
			const result = await this.getEvaluationResult(evaluationId);
			
			if (result.status === 'completed' || result.status === 'failed') {
				return result;
			}
			
			// Poll immediately without delay
		}
		
		throw new Error(`Evaluation ${evaluationId} timed out after ${timeout}ms`);
	}

	/**
	 * Get evaluation result by ID
	 */
	public async getEvaluationResult(evaluationId: string): Promise<EvaluationResult> {
        const headers = {
            'X-Api-Key': this.config.apiKey,
            'X-Secret-Key': this.config.secretKey,
            'Content-Type': 'application/json',
        } as Record<string, string>;

        try {
            const response: any = await this.config.httpRequest({
                method: 'GET',
                url: `${this.config.baseUrl}/sdk/api/v1/new-eval/`,
                headers,
                qs: { eval_id: evaluationId },
                json: true,
            });
			
            return response;
        } catch (error: any) {
            if (error?.response?.status === 404 || error?.statusCode === 404) {
				return {
					evaluationId,
					status: 'pending',
					timestamp: new Date().toISOString(),
				};
			}
			throw error;
		}
	}

	/**
	 * Process the evaluation queue
	 */
	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.evaluationQueue.length === 0) {
			return;
		}

		this.isProcessing = true;
		const batch = this.evaluationQueue.splice(0, this.config.batchSize);

		try {
			await this.submitBatch(batch);
			
			// Add to pending evaluations for status tracking
			for (const request of batch) {
				this.pendingEvaluations.set(request.evaluationId, request);
			}
        } catch (error) {
            safeWarn('Failed to submit evaluation batch:', (error as any).message);
			this.requeueWithRetry(batch);
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Submit a batch of evaluation requests
	 */
	private async submitBatch(batch: EvaluationRequest[]): Promise<void> {
        const headers = {
            'X-Api-Key': this.config.apiKey,
            'X-Secret-Key': this.config.secretKey,
            'Content-Type': 'application/json',
        } as Record<string, string>;

        // Submit one by one using /sdk/api/v1/new-eval/ since batch endpoint doesn't exist
        for (const req of batch) {
            const payload = {
                eval_name: req.evaluationName,
                inputs: req.config?.criteria?.inputs || { input: '' },
                model: req.config?.model,
                span_id: req.config?.metadata?.span_id,
                custom_eval_name: req.config?.metadata?.custom_eval_name,
                trace_eval: req.config?.metadata?.trace_eval ?? false,
                is_async: true,
            } as any;
            await this.config.httpRequest({
                method: 'POST',
                url: `${this.config.baseUrl}/sdk/api/v1/new-eval/`,
                headers,
                body: payload,
                json: true,
                timeout: 15000,
            });
        }
	}

	/**
	 * Re-queue failed evaluation requests with retry logic
	 */
	private requeueWithRetry(batch: EvaluationRequest[]): void {
		for (const request of batch) {
			request.retryCount = (request.retryCount || 0) + 1;
			
			if (request.retryCount <= this.config.maxRetries) {
				// Re-queue immediately without delay
				this.evaluationQueue.unshift(request);
			} else {
                safeError('Max retries exceeded for evaluation:', request.evaluationId);
			}
		}
	}

	/**
	 * Start polling for evaluation results (removed interval polling)
	 */
	private startPolling(): void {
		// Removed automatic polling - process queue and check evaluations on demand
	}

	/**
	 * Poll pending evaluations for status updates
	 */
	// private async pollPendingEvaluations(): Promise<void> {
	// 	const pendingIds = Array.from(this.pendingEvaluations.keys());
		
	// 	for (const evaluationId of pendingIds) {
	// 		try {
	// 			const result = await this.getEvaluationResult(evaluationId);
				
	// 			if (result.status === 'completed' || result.status === 'failed') {
	// 				this.pendingEvaluations.delete(evaluationId);
	// 				// Emit event or callback for completed evaluation
	// 				this.onEvaluationComplete(result);
	// 			}
    //         } catch (error) {
    //             if (globalThis.console && (globalThis.console as any).warn) {
    //                 (globalThis.console as any).warn(`Failed to poll evaluation ${evaluationId}:`, (error as any).message);
    //             }
	// 		}
	// 	}
	// }

	/**
	 * Handle completed evaluation (override in subclass or set callback)
	 */
	protected onEvaluationComplete(result: EvaluationResult): void {
        safeLog(`Evaluation ${result.evaluationId} completed with status: ${result.status}`);
	}

	/**
	 * Stop the evaluator and clean up
	 */
	public async stop(): Promise<void> {
		// Removed timer cleanup since we don't use intervals anymore
		await this.processQueue();
	}

	/**
	 * Generate a unique evaluation ID
	 */
	private generateEvaluationId(): string {
		return `eval_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}

	/**
	 * Generate a unique batch ID
	 */
	// private generateBatchId(): string {
	// 	return `eval_batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	// }

	/**
	 * Get current evaluator status
	 */
	public getStatus(): { 
		queueSize: number; 
		pendingCount: number; 
		isProcessing: boolean;
	} {
		return {
			queueSize: this.evaluationQueue.length,
			pendingCount: this.pendingEvaluations.size,
			isProcessing: this.isProcessing,
		};
	}

	/**
	 * Create evaluation config for common evaluation types
	 */
	public static createQualityConfig(criteria: Record<string, any>): EvaluationConfig {
		return {
			type: 'quality',
			criteria: {
				accuracy: criteria.accuracy || 0.8,
				relevance: criteria.relevance || 0.8,
				coherence: criteria.coherence || 0.8,
				...criteria,
			},
			thresholds: {
				minimum_score: 0.7,
				...criteria.thresholds,
			},
		};
	}

	public static createSafetyConfig(criteria: Record<string, any>): EvaluationConfig {
		return {
			type: 'safety',
			criteria: {
				toxicity: criteria.toxicity || 0.1,
				bias: criteria.bias || 0.1,
				harmful_content: criteria.harmful_content || 0.1,
				...criteria,
			},
			thresholds: {
				maximum_toxicity: 0.2,
				...criteria.thresholds,
			},
		};
	}

	public static createPerformanceConfig(criteria: Record<string, any>): EvaluationConfig {
		return {
			type: 'performance',
			criteria: {
				latency: criteria.latency || 5000,
				throughput: criteria.throughput || 100,
				cost: criteria.cost || 0.01,
				...criteria,
			},
			thresholds: {
				max_latency: 10000,
				min_throughput: 50,
				...criteria.thresholds,
			},
		};
	}
}

// Singleton evaluator instance
let evaluatorInstance: AsyncEvaluator | null = null;

/**
 * Get or create the global evaluator instance
 */
export function getEvaluator(config?: EvaluatorConfig): AsyncEvaluator {
	if (!evaluatorInstance && config) {
		evaluatorInstance = new AsyncEvaluator(config);
	}
	
	if (!evaluatorInstance) {
		throw new Error('Evaluator not initialized. Please provide config on first call.');
	}
	
	return evaluatorInstance;
}

/**
 * Initialize the global evaluator
 */
export function initializeEvaluator(config: EvaluatorConfig): AsyncEvaluator {
	if (evaluatorInstance) {
		evaluatorInstance.stop();
	}
	
	evaluatorInstance = new AsyncEvaluator(config);
	return evaluatorInstance;
}

