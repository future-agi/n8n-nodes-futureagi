import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FutureAgiApi implements ICredentialType {
	name = 'futureAgiApi';
	displayName = 'Future AGI API';
	documentationUrl = 'https://docs.futureagi.com/api/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.futureagi.com',
			description: 'The base URL of your Future AGI instance',
			placeholder: 'https://api.futureagi.com',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your Future AGI API key',
			placeholder: 'fagi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your Future AGI secret key',
			placeholder: 'fagi_secret_xxxxxxxxxxxxxxxxxxxxxxxxxx',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'string',
			default: '',
			description: 'Your Future AGI organization ID (optional)',
			placeholder: 'org_xxxxxxxxxxxxxxxx',
		},
		{
			displayName: 'Project ID',
			name: 'projectId',
			type: 'string',
			default: '',
			description: 'Your Future AGI project ID (optional)',
			placeholder: 'proj_xxxxxxxxxxxxxxxx',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'production',
				},
				{
					name: 'Staging',
					value: 'staging',
				},
				{
					name: 'Development',
					value: 'development',
				},
			],
			default: 'production',
			description: 'The environment to connect to',
		},
		{
			displayName: 'Enable Async Logging',
			name: 'enableAsyncLogging',
			type: 'boolean',
			default: true,
			description: 'Whether to enable asynchronous logging of executions',
		},
		{
			displayName: 'Logging Batch Size',
			name: 'loggingBatchSize',
			type: 'number',
			default: 10,
			description: 'Number of log entries to batch before sending',
			displayOptions: {
				show: {
					enableAsyncLogging: [true],
				},
			},
		},
		{
			displayName: 'Logging Flush Interval (ms)',
			name: 'loggingFlushInterval',
			type: 'number',
			default: 5000,
			description: 'Interval in milliseconds to flush pending logs',
			displayOptions: {
				show: {
					enableAsyncLogging: [true],
				},
			},
		},
		{
			displayName: 'Enable Async Evaluation',
			name: 'enableAsyncEvaluation',
			type: 'boolean',
			default: true,
			description: 'Whether to enable asynchronous evaluation capabilities',
		},
		{
			displayName: 'Evaluation Batch Size',
			name: 'evaluationBatchSize',
			type: 'number',
			default: 5,
			description: 'Number of evaluations to batch before sending',
			displayOptions: {
				show: {
					enableAsyncEvaluation: [true],
				},
			},
		},
		{
			displayName: 'Evaluation Poll Interval (ms)',
			name: 'evaluationPollInterval',
			type: 'number',
			default: 10000,
			description: 'Interval in milliseconds to poll for evaluation results',
			displayOptions: {
				show: {
					enableAsyncEvaluation: [true],
				},
			},
		},
		{
			displayName: 'Max Retries',
			name: 'maxRetries',
			type: 'number',
			default: 3,
			description: 'Maximum number of retries for failed requests',
		},
		{
			displayName: 'Retry Delay (ms)',
			name: 'retryDelay',
			type: 'number',
			default: 1000,
			description: 'Base delay in milliseconds between retries',
		},
		{
			displayName: 'Request Timeout (ms)',
			name: 'requestTimeout',
			type: 'number',
			default: 30000,
			description: 'Timeout in milliseconds for API requests',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Api-Key': '={{$credentials.apiKey}}',
				'X-Secret-Key': '={{$credentials.secretKey}}',
				'User-Agent': 'n8n-future-agi-node/1.0.0',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/health',
			method: 'GET',
		}
	};
}

