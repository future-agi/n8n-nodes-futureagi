import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';
import { safeWarn } from './helper';

// Native UUID v4 generation function
function generateUuid(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

// Native function to format time distance (replaces date-fns formatDistanceToNow)
function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	
	if (diffInSeconds < 60) {
		return diffInSeconds <= 1 ? 'just now' : `${diffInSeconds} seconds`;
	}
	
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return diffInMinutes === 1 ? '1 minute' : `${diffInMinutes} minutes`;
	}
	
	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return diffInHours === 1 ? '1 hour' : `${diffInHours} hours`;
	}
	
	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		return diffInDays === 1 ? '1 day' : `${diffInDays} days`;
	}
	
	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return diffInMonths === 1 ? '1 month' : `${diffInMonths} months`;
	}
	
	const diffInYears = Math.floor(diffInMonths / 12);
	return diffInYears === 1 ? '1 year' : `${diffInYears} years`;
}

export class FutureAgi implements INodeType {
    description: INodeTypeDescription = {
		displayName: 'Future AGI',
		name: 'futureAgi',
		icon: 'file:futureagi.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Future AGI prompt management, logging, and evaluation',
		defaults: {
			name: 'Future AGI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'futureAgiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Prompt',
						value: 'getPrompt',
						description: 'Retrieve a prompt from Future AGI prompt management',
						action: 'Get a prompt from future agi',
					},
					// {
					// 	name: 'Log Execution',
					// 	value: 'logExecution',
					// 	description: 'Log execution data to Future AGI (async)',
					// 	action: 'Log execution data to Future AGI',
					// },
					// {
					// 	name: 'Run Evaluation',
					// 	value: 'runEvaluation',
					// 	description: 'Trigger evaluation on Future AGI (async)',
					// 	action: 'Run evaluation on Future AGI',
					// },
					// {
					// 	name: 'Protect Content',
					// 	value: 'protectContent',
					// 	description: 'Scan and protect content using Future AGI protection capabilities',
					// 	action: 'Protect content with Future AGI',
					// },
				],
				default: 'getPrompt',
			},
			{
				displayName: 'Simplify Output',
				name: 'simplifyEval',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['runEvaluation'],
					},
				},
				default: false,
				description: 'Whether to return a simplified result instead of full evaluation payload',
			},
			// Get Prompt operation fields
			{
				displayName: 'Prompt Name or ID',
				name: 'promptName',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['getPrompt'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getPromptOptions',
				},
				default: '',
				description: 'Name of the prompt to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Use Default Version',
				name: 'useDefaultVersion',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['getPrompt'],
					},
				},
				default: true,
				description: 'Whether to use the default version configured for this prompt in Future AGI',
			},
			{
				displayName: 'Prompt Version',
				name: 'promptVersion',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getPrompt'],
						useDefaultVersion: [false],
					},
				},
				default: '',
				placeholder: 'e.g. v3',
				description: 'Version/label of the prompt to retrieve when not using default version',
			},
			// Log Execution operation fields
			{
				displayName: 'Execution ID',
				name: 'executionId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['logExecution'],
					},
				},
				default: '',
				description: 'Unique execution ID (auto-generated if empty)',
			},
			{
				displayName: 'Prompt Name',
				name: 'logPromptName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['logExecution'],
					},
				},
				default: '',
				description: 'Name of the prompt that was executed',
			},
			{
				displayName: 'Input Data',
				name: 'inputData',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						operation: ['logExecution'],
					},
				},
				default: '{}',
				description: 'Input data that was sent to the LLM',
			},
			{
				displayName: 'Output Data',
				name: 'outputData',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						operation: ['logExecution'],
					},
				},
				default: '{}',
				description: 'Output data received from the LLM',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['logExecution'],
					},
				},
				default: '{}',
				description: 'Additional metadata (model, tokens, latency, etc.)',
			},
			// Run Evaluation operation fields
			{
				displayName: 'Execution ID',
				name: 'evalExecutionId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['runEvaluation'],
					},
				},
				default: '',
				description: 'Execution ID to evaluate (if empty, evaluates current execution)',
			},
			{
				displayName: 'Evaluation Configurations',
				name: 'evaluationConfigs',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['runEvaluation'],
					},
				},
				default: {},
				description: 'Multiple evaluation configurations to run',
				options: [
					{
						name: 'evaluations',
						displayName: 'Evaluation',
						values: [
							{
								displayName: 'Evaluation Criteria',
								name: 'criteria',
								type: 'json',
								default: '{\'accuracy\':	0.8, \'relevance\':	0.9}',
								description: 'Evaluation criteria as JSON object',
								placeholder: '{\'accuracy\':	0.8, \'relevance\':	0.9, \'coherence\':	0.85}',
							},
							{
								displayName: 'Evaluation Name',
								name: 'name',
								type: 'string',
									required:	true,
								default: '',
								description: 'Name of the evaluation to run',
								placeholder: 'quality-assessment',
							},
							{
								displayName: 'Evaluation Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Quality',
										value: 'quality',
										description: 'Evaluate response quality (accuracy, relevance, coherence)',
									},
									{
										name: 'Safety',
										value: 'safety',
										description: 'Evaluate content safety (toxicity, bias, harmful content)',
									},
									{
										name: 'Performance',
										value: 'performance',
										description: 'Evaluate performance metrics (latency, throughput, cost)',
									},
									{
										name: 'Custom',
										value: 'custom',
										description: 'Custom evaluation with user-defined criteria',
									},
								],
								default: 'quality',
								description: 'Type of evaluation to perform',
							},
							{
						displayName: 'Metadata',
						name: 'metadata',
						type: 'json',
						default: '{}',
						description: 'Additional metadata for this evaluation (optional)',
						placeholder: '{\'priority\': \'high\', \'tags\':	[\'production\']}',
							},
							{
						displayName: 'Model',
						name: 'model',
						type: 'string',
						default: '',
						description: 'Specific model to use for evaluation (optional)',
						placeholder: 'gpt-4',
							},
							{
						displayName: 'Thresholds',
						name: 'thresholds',
						type: 'json',
						default: '{\'minimum_score\':	0.7}',
						description: 'Evaluation thresholds as JSON object (optional)',
						placeholder: '{\'minimum_score\':	0.7, \'maximum_toxicity\':	0.2}',
							},
							{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Timeout for this evaluation in milliseconds',
							},
					],
					},
				],
			},
			{
				displayName: 'Wait for Results',
				name: 'waitForResult',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['runEvaluation'],
					},
				},
				default: false,
				description: 'Whether to wait for all evaluation results (sync) or return immediately (async)',
			},
			{
				displayName: 'Parallel Execution',
				name: 'parallelExecution',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['runEvaluation'],
					},
				},
				default: true,
				description: 'Whether to run evaluations in parallel (faster) or sequentially',
			},
			// Protect Content operation fields
			{
				displayName: 'Content to Protect',
				name: 'contentToProtect',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: '',
                description: 'The content to scan and protect',
                placeholder: 'e.g. Hello John Doe, SSN 123-45-6789',
			},
			{
				displayName: 'Protection Type',
				name: 'protectionType',
				type: 'options',
				options: [
					{
						name: 'Bias Detection',
						value: 'bias_detection',
						description: 'Detect and mitigate biased content',
					},
					{
						name: 'Comprehensive',
						value: 'comprehensive',
						description: 'Apply all protection measures',
					},
					{
						name: 'Content Filtering',
						value: 'content_filtering',
						description: 'Filter harmful, toxic, or inappropriate content',
					},
					{
						name: 'PII Detection',
						value: 'pii_detection',
						description: 'Detect and protect personally identifiable information',
					},
					{
						name: 'Prompt Injection',
						value: 'prompt_injection',
						description: 'Detect and prevent prompt injection attacks',
					},
				],
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: 'comprehensive',
				description: 'Type of protection to apply',
			},
			{
				displayName: 'Protection Level',
				name: 'protectionLevel',
				type: 'options',
				options: [
					{
						name: 'Low',
						value: 'low',
						description: 'Basic protection with minimal content modification',
					},
					{
						name: 'Medium',
						value: 'medium',
						description: 'Balanced protection with moderate content modification',
					},
					{
						name: 'High',
						value: 'high',
						description: 'Strict protection with aggressive content modification',
					},
					{
						name: 'Custom',
						value: 'custom',
						description: 'Custom protection level with user-defined settings',
					},
				],
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
                default: 'medium',
				description: 'Level of protection to apply',
			},
			{
				displayName: 'Custom Protection Settings',
				name: 'customProtectionSettings',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['protectContent'],
						protectionLevel: ['custom'],
					},
				},
				default: '{"toxicity_threshold": 0.7, "pii_redaction": true, "bias_threshold": 0.8}',
				description: 'Custom protection settings as JSON object',
                placeholder: 'e.g. {"toxicity_threshold": 0.7, "pii_redaction": true, "bias_threshold": 0.8}',
			},
			{
				displayName: 'Return Original',
				name: 'returnOriginal',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: false,
				description: 'Whether to return the original content along with the protected version',
			},
			{
				displayName: 'Include Risk Analysis',
				name: 'includeRiskAnalysis',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: true,
				description: 'Whether to include detailed risk analysis in the response',
			},
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'options',
				options: [
					{
						name: 'Plain Text',
						value: 'text',
						description: 'Plain text content',
					},
					{
						name: 'HTML',
						value: 'html',
						description: 'HTML formatted content',
					},
					{
						name: 'Markdown',
						value: 'markdown',
						description: 'Markdown formatted content',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'JSON structured content',
					},
				],
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: 'text',
				description: 'Type of content being protected',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
                default: 'en',
                description: 'Language of the content (ISO 639-1 code)',
                placeholder: 'e.g. en',
			},
			{
				displayName: 'Context',
				name: 'context',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
                default: '',
                description: 'Additional context about the content (optional)',
                placeholder: 'e.g. customer support response',
			},
			{
				displayName: 'Async Processing',
				name: 'asyncProcessing',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: false,
				description: 'Whether to process protection asynchronously (for large content)',
			},
			{
				displayName: 'Simplify Output',
				name: 'simplifyProtect',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['protectContent'],
					},
				},
				default: false,
				description: 'Whether to return a simplified result instead of full protection payload',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

        const credentials = await this.getCredentials('futureAgiApi');
        const baseUrl = credentials.baseUrl as string;
        const apiKey = credentials.apiKey as string;
        const secretKey = (credentials as any).secretKey as string;

        const headers = {
            'X-Api-Key': apiKey,
            'X-Secret-Key': secretKey,
            'Content-Type': 'application/json',
        };

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (operation === 'getPrompt') {
					responseData = await getPrompt.call(this, baseUrl, headers, i);
				} else if (operation === 'logExecution') {
					responseData = await logExecution.call(this, baseUrl, headers, i);
				} else if (operation === 'runEvaluation') {
					responseData = await runEvaluation.call(this, baseUrl, headers, i);
				} else if (operation === 'protectContent') {
					responseData = await protectContent.call(this, baseUrl, headers, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex: i,
					});
				}

				returnData.push({
					json: responseData,
					pairedItem: {
						item: i,
					},
				});
            } catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	}

// Helper functions defined at module scope so they can be invoked with the n8n execution context via .call(this, ...)
async function getPrompt(this: IExecuteFunctions, baseUrl: string, headers: any, itemIndex: number): Promise<any> {
    const promptName = this.getNodeParameter('promptName', itemIndex) as string;
    const useDefaultVersion = this.getNodeParameter('useDefaultVersion', itemIndex) as boolean;
    const promptVersion = this.getNodeParameter('promptVersion', itemIndex, '') as string;

    const isVersionTag = /^v\d+$/i.test(promptVersion);
    let response: any;
    try {
        const params: any = { name: promptName };
        if (!useDefaultVersion && promptVersion) {
            Object.assign(params, isVersionTag ? { version: promptVersion } : { label: promptVersion });
        }
        response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${baseUrl}/model-hub/prompt-templates/get-template-by-name/`,
            headers,
            qs: params,
            json: true,
        });
    } catch (error: any) {
        const status = error?.response?.status || error?.statusCode;
        const data = error?.response?.data || error?.body;
        const serverMsg =
            typeof data === 'string'
                ? data
                : data?.detail || data?.message || data?.error || JSON.stringify(data || {});
        throw new NodeOperationError(this.getNode(), `Failed to get prompt: HTTP ${status || ''} ${serverMsg || error.message}`, {
            itemIndex: itemIndex,
        });
    }

    const promptConfig = Array.isArray(response.promptConfig)
        ? response.promptConfig[0]
        : response.promptConfig;
	const variables = Object.keys(response.variable_names);

    return {
        "Name": response.name,
        "Version": response.version,
        "Prompt config": promptConfig,
        "Variables": variables,
    };
}

async function logExecution(this: IExecuteFunctions, baseUrl: string, headers: any, itemIndex: number): Promise<any> {
    const executionId = (this.getNodeParameter('executionId', itemIndex) as string) || generateUuid();
    const promptName = this.getNodeParameter('logPromptName', itemIndex) as string;
    const inputData = this.getNodeParameter('inputData', itemIndex) as object;
    const outputData = this.getNodeParameter('outputData', itemIndex) as object;
    const metadata = this.getNodeParameter('metadata', itemIndex) as object;

    const logData = {
        executionId,
        promptName,
        inputData,
        outputData,
        metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            nodeExecutionId: this.getExecutionId(),
        },
    };

    this.helpers.httpRequest({
        method: 'POST',
        url: `${baseUrl}/sdk/api/v1/log/event/`,
        headers,
        body: logData,
        json: true,
    }).catch((error: any) => {
        safeWarn('Failed to log execution to Future AGI:', error.message);
    });

    return {
        success: true,
        executionId,
        message: 'Execution logged asynchronously',
    };
}

async function runEvaluation(this: IExecuteFunctions, baseUrl: string, headers: any, itemIndex: number): Promise<any> {
    const executionId = (this.getNodeParameter('evalExecutionId', itemIndex) as string) || generateUuid();
    const evaluationConfigs = this.getNodeParameter('evaluationConfigs', itemIndex) as any;
    const waitForResult = this.getNodeParameter('waitForResult', itemIndex) as boolean;
    const parallelExecution = this.getNodeParameter('parallelExecution', itemIndex) as boolean;

    const evaluations = evaluationConfigs.evaluations || [];
    if (evaluations.length === 0) {
        throw new NodeOperationError(this.getNode(), 'At least one evaluation configuration is required', {
            itemIndex,
        });
    }

    const evalRequests = evaluations.map((evaluation: any) => {
        const evaluationId = generateUuid();
        const criteria = typeof evaluation.criteria === 'string' ? JSON.parse(evaluation.criteria) : evaluation.criteria;
        const metadata = evaluation.metadata
            ? typeof evaluation.metadata === 'string'
                ? JSON.parse(evaluation.metadata)
                : evaluation.metadata
            : {};
        return {
            evaluationId,
            evaluationName: evaluation.name,
            executionId,
            payload: {
                eval_name: evaluation.name,
                inputs: criteria?.inputs || { input: '' },
                model: evaluation.model || undefined,
                span_id: metadata?.span_id,
                custom_eval_name: metadata?.custom_eval_name,
                trace_eval: metadata?.trace_eval ?? false,
                is_async: !waitForResult,
            },
            timeout: evaluation.timeout || 30000,
        };
    });

    if (waitForResult) {
        if (parallelExecution) {
            const promises = evalRequests.map((req: any) =>
                this.helpers.httpRequest({
                    method: 'POST',
                    url: `${baseUrl}/sdk/api/v1/new-eval/`,
                    headers,
                    body: req.payload,
                    json: true,
                })
                    .then((response: any) => ({
                        evaluationId: req.evaluationId,
                        evaluationName: req.evaluationName,
                        success: true,
                        result: response,
                    }))
                    .catch((error: any) => ({
                        evaluationId: req.evaluationId,
                        evaluationName: req.evaluationName,
                        success: false,
                        error: error.message,
                    }))
            );

            const results = await Promise.all(promises);
            const simplify = this.getNodeParameter('simplifyEval', itemIndex) as boolean;
            const payload = {
                success: true,
                executionId,
                evaluationCount: evalRequests.length,
                results: simplify
                    ? results.map((r) => ({
                          evaluationId: r.evaluationId,
                          evaluationName: r.evaluationName,
                          success: r.success,
                          value: r.result?.result?.value ?? r.result?.value,
                          error: r.error,
                      }))
                    : results,
                parallelExecution: true,
            };
            return payload;
        } else {
            const results: any[] = [];
            for (const req of evalRequests as any[]) {
                try {
                    const response: any = await this.helpers.httpRequest({
                        method: 'POST',
                        url: `${baseUrl}/sdk/api/v1/new-eval/`,
                        headers,
                        body: req.payload,
                        json: true,
                    });
                    results.push({
                        evaluationId: req.evaluationId,
                        evaluationName: req.evaluationName,
                        success: true,
                        result: response,
                    });
                } catch (error: any) {
                    results.push({
                        evaluationId: req.evaluationId,
                        evaluationName: req.evaluationName,
                        success: false,
                        error: error.message,
                    });
                }
            }
            const simplify = this.getNodeParameter('simplifyEval', itemIndex) as boolean;
            return {
                success: true,
                executionId,
                evaluationCount: evalRequests.length,
                results: simplify
                    ? results.map((r) => ({
                          evaluationId: r.evaluationId,
                          evaluationName: r.evaluationName,
                          success: r.success,
                          value: r.result?.result?.value ?? r.result?.value,
                          error: r.error,
                      }))
                    : results,
                parallelExecution: false,
            };
        }
    } else {
        const evaluationIds: string[] = [];

        if (parallelExecution) {
            const promises = (evalRequests as any[]).map(async (req: any) => {
                try {
                    const data: any = await this.helpers.httpRequest({
                        method: 'POST',
                        url: `${baseUrl}/sdk/api/v1/new-eval/`,
                        headers,
                        body: req.payload,
                        json: true,
                    });
                    const serverEvalId = (data && (data.eval_id || data?.result?.eval_id)) || req.evaluationId;
                    evaluationIds.push(String(serverEvalId));
                } catch (error: any) {
                    evaluationIds.push(req.evaluationId);
                    safeWarn(`Failed to trigger evaluation ${req.evaluationName} on Future AGI:`, (error as any).message);
                }
            });

            Promise.all(promises);
        } else {
            for (const req of evalRequests as any[]) {
                try {
                    const data: any = await this.helpers.httpRequest({
                        method: 'POST',
                        url: `${baseUrl}/sdk/api/v1/new-eval/`,
                        headers,
                        body: req.payload,
                        json: true,
                    });
                    const serverEvalId = (data && (data.eval_id || data?.result?.eval_id)) || req.evaluationId;
                    evaluationIds.push(String(serverEvalId));
                } catch (error: any) {
                    evaluationIds.push(req.evaluationId);
                    safeWarn(`Failed to trigger evaluation ${req.evaluationName} on Future AGI:`, (error as any).message);
                }
            }
        }

        const simplify = this.getNodeParameter('simplifyEval', itemIndex) as boolean;
        const base = {
            success: true,
            executionId,
            evaluationCount: evalRequests.length,
            evaluationIds,
            message: `${evalRequests.length} evaluations triggered asynchronously`,
            parallelExecution,
        };
        return simplify
            ? base
            : { ...base, evaluations: (evalRequests as any[]).map((req: any) => ({ evaluationId: req.evaluationId, evaluationName: req.evaluationName })) };
    }
}

async function protectContent(this: IExecuteFunctions, baseUrl: string, headers: any, itemIndex: number): Promise<any> {
    const contentToProtect = this.getNodeParameter('contentToProtect', itemIndex) as string;
    const protectionType = this.getNodeParameter('protectionType', itemIndex) as string;
    const protectionLevel = this.getNodeParameter('protectionLevel', itemIndex) as string;
    const customProtectionSettings = this.getNodeParameter('customProtectionSettings', itemIndex, '{}') as string;
    const returnOriginal = this.getNodeParameter('returnOriginal', itemIndex) as boolean;
    const includeRiskAnalysis = this.getNodeParameter('includeRiskAnalysis', itemIndex) as boolean;
    const asyncProcessing = this.getNodeParameter('asyncProcessing', itemIndex) as boolean;

    if (protectionLevel === 'custom' && customProtectionSettings) {
        try {
            if (typeof customProtectionSettings === 'string') {
                JSON.parse(customProtectionSettings);
            }
        } catch (error) {
            throw new NodeOperationError(this.getNode(), 'Invalid JSON in custom protection settings', {
                itemIndex,
            });
        }
    }

    const evalPayload = {
        eval_name: 'protect_flash',
        inputs: { input: contentToProtect },
        model: undefined,
        span_id: undefined,
        custom_eval_name: undefined,
        trace_eval: false,
        protect_flash: true,
        is_async: asyncProcessing,
    } as any;

    if (asyncProcessing) {
        const protectionId = generateUuid();
        this.helpers.httpRequest({
            method: 'POST',
            url: `${baseUrl}/sdk/api/v1/new-eval/`,
            headers,
            body: evalPayload,
            json: true,
        }).catch((error: any) => {
            safeWarn('Failed to trigger content protection on Future AGI:', error.message);
        });
        const simplify = this.getNodeParameter('simplifyProtect', itemIndex) as boolean;
        const base = {
            success: true,
            protectionId,
            message: 'Content protection triggered asynchronously',
            contentLength: contentToProtect.length,
            protectionType,
            protectionLevel,
        };
        return simplify ? { success: true, protectionId } : base;
    }

    try {
        const response: any = await this.helpers.httpRequest({
            method: 'POST',
            url: `${baseUrl}/sdk/api/v1/new-eval/`,
            headers,
            body: evalPayload,
            json: true,
        });
        const result = response?.result || response;
        const protectionResult: any = {
            success: true,
            protectionId: result?.eval_id || generateUuid(),
            protectedContent: result?.value ?? null,
            contentLength: contentToProtect.length,
            protectedContentLength: result?.value ? String(result.value).length : 0,
            protectionType,
            protectionLevel,
            riskScore: result?.risk_score || 0,
        };

        if (returnOriginal) (protectionResult as any).originalContent = contentToProtect;
        if (includeRiskAnalysis && (result as any)?.riskAnalysis) (protectionResult as any).riskAnalysis = (result as any).riskAnalysis;
        if ((result as any)?.statistics) (protectionResult as any).statistics = (result as any).statistics;
        const simplify = this.getNodeParameter('simplifyProtect', itemIndex) as boolean;
        return simplify
            ? { success: true, protectionId: protectionResult.protectionId, protectedContent: protectionResult.protectedContent, riskScore: protectionResult.riskScore }
            : protectionResult;
    } catch (error: any) {
        throw new NodeOperationError(this.getNode(), `Content protection failed: ${error.message}`, {
            itemIndex,
        });
    }
}

// Load Options methods
(FutureAgi.prototype as any).methods = {
    loadOptions: {
        async getPromptOptions(this: any) {
            const credentials = await this.getCredentials('futureAgiApi');
            const baseUrl = credentials.baseUrl as string;
            const apiKey = credentials.apiKey as string;
            const secretKey = (credentials as any).secretKey as string;
            
            try {
                const response = await this.helpers.httpRequest({
                    method: 'GET',
                    url: `${baseUrl}/model-hub/prompt-executions/`,
                    headers: {
                        'X-Api-Key': apiKey,
                        'X-Secret-Key': secretKey,
                        'Content-Type': 'application/json',
                    },
                    qs: {
                        page_size: 5000,
                    },
                    json: true,
                });
                const list = Array.isArray(response?.results) ? response.results : [];
                const names = new Array<object>();
                for (const t of list) {
                    names.push({ name: t.name, value: t.name, description: t?.updatedAt ? `Updated ${formatTimeAgo(new Date(t.updatedAt))} ago` : undefined });
                }
                return names;
            } catch {
                return [];
            }
        },
    }
};

