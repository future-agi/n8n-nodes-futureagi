# n8n-nodes-futureagi

[![npm version](https://badge.fury.io/js/%40future-agi%2Fn8n-nodes-futureagi.svg)](https://badge.fury.io/js/%40future-agi%2Fn8n-nodes-futureagi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is an n8n community node that enables seamless integration with Future AGI's prompt management, execution logging, and evaluation capabilities. It provides advanced features for managing AI workflows with comprehensive observability and quality assurance.

[Future AGI](https://futureagi.com) is a next-generation AI platform that provides prompt management, execution tracking, and automated evaluation capabilities for AI applications.

[n8n](https://n8n.io) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

- **Prompt Management**: Retrieve and manage prompts with versioning support
- **Async Execution Logging**: Automatically log AI executions with retry mechanisms
- **Async Evaluation System**: Trigger quality, safety, and performance evaluations
- **Content Protection**: Scan and protect content against various risks and threats
- **Batch Processing**: Efficient batch operations for logging and evaluations
- **Template Variables**: Dynamic prompt template substitution
- **Comprehensive Error Handling**: Robust error handling with retry logic
- **Multiple Environments**: Support for production, staging, and development environments

## Installation

### Self-hosted n8n

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```bash
npm install @future-agi/n8n-nodes-futureagi
```

### n8n Cloud

This is a verified community node. Search for `Future AGI` to use this node in n8n Cloud.

## Operations

### Get Prompt

Retrieve a prompt from Future AGI prompt management with support for versioning and template variables.

**Parameters:**
- `Prompt Name` (required): Name of the prompt to retrieve
- `Prompt Version`: Version/label of the prompt (defaults to "production")
- `Template Variables`: Key-value pairs for template substitution

**Example:**
```json
{
  "promptName": "customer-support-agent",
  "promptVersion": "v2.1",
  "templateVariables": {
    "variables": [
      {"key": "customer_name", "value": "John Doe"},
      {"key": "issue_type", "value": "billing"}
    ]
  }
}
```

### Log Execution

Asynchronously log execution data to Future AGI for observability and analysis.

**Parameters:**
- `Execution ID`: Unique execution identifier (auto-generated if empty)
- `Prompt Name` (required): Name of the executed prompt
- `Input Data` (required): JSON input data sent to the AI model
- `Output Data` (required): JSON output data received from the AI model
- `Metadata`: Additional metadata (model info, tokens, latency, etc.)

**Example:**
```json
{
  "logPromptName": "customer-support-agent",
  "inputData": {
    "messages": [
      {"role": "user", "content": "I need help with my billing"}
    ]
  },
  "outputData": {
    "response": "I'd be happy to help you with your billing inquiry...",
    "confidence": 0.95
  },
  "metadata": {
    "model": "gpt-4",
    "tokens_used": 150,
    "latency_ms": 1200,
    "cost": 0.003
  }
}
```

### Run Evaluation

Trigger multiple evaluations on Future AGI to assess quality, safety, and performance of AI outputs simultaneously.

**Parameters:**
- `Execution ID`: ID of execution to evaluate (current execution if empty)
- `Evaluation Configurations`: Collection of multiple evaluation configurations
  - `Evaluation Name` (required): Name of the evaluation to run
  - `Evaluation Type`: Type of evaluation (Quality, Safety, Performance, Custom)
  - `Evaluation Criteria`: JSON criteria for the evaluation
  - `Thresholds`: JSON thresholds for pass/fail determination (optional)
  - `Model`: Specific model to use for evaluation (optional)
  - `Timeout`: Timeout for this evaluation in milliseconds
  - `Metadata`: Additional metadata for this evaluation (optional)
- `Wait for Results`: Whether to wait for all results (sync) or return immediately (async)
- `Parallel Execution`: Whether to run evaluations in parallel or sequentially

**Example with Multiple Evaluations:**
```json
{
  "evaluationConfigs": {
    "evaluations": [
      {
        "name": "quality-assessment",
        "type": "quality",
        "criteria": "{\"accuracy\": 0.8, \"relevance\": 0.9, \"coherence\": 0.85}",
        "thresholds": "{\"minimum_score\": 0.7}",
        "timeout": 30000,
        "metadata": "{\"priority\": \"high\"}"
      },
      {
        "name": "safety-check",
        "type": "safety",
        "criteria": "{\"toxicity\": 0.1, \"bias\": 0.1, \"harmful_content\": 0.1}",
        "thresholds": "{\"maximum_toxicity\": 0.2}",
        "timeout": 25000,
        "metadata": "{\"compliance\": \"required\"}"
      },
      {
        "name": "performance-metrics",
        "type": "performance",
        "criteria": "{\"latency\": 5000, \"cost\": 0.01}",
        "thresholds": "{\"max_latency\": 10000}",
        "timeout": 15000
      }
    ]
  },
  "waitForResult": false,
  "parallelExecution": true
}
```

### Protect Content

Scan and protect content using Future AGI's advanced protection capabilities to detect and mitigate various risks.

**Parameters:**
- `Content to Protect` (required): The text content to scan and protect
- `Protection Type`: Type of protection to apply
  - `Content Filtering`: Filter harmful, toxic, or inappropriate content
  - `PII Detection`: Detect and protect personally identifiable information
  - `Bias Detection`: Detect and mitigate biased content
  - `Prompt Injection`: Detect and prevent prompt injection attacks
  - `Comprehensive`: Apply all protection measures
- `Protection Level`: Level of protection intensity
  - `Low`: Basic protection with minimal content modification
  - `Medium`: Balanced protection with moderate content modification
  - `High`: Strict protection with aggressive content modification
  - `Custom`: Custom protection level with user-defined settings
- `Custom Protection Settings`: JSON configuration for custom protection level
- `Return Original`: Whether to include original content in response
- `Include Risk Analysis`: Whether to include detailed risk analysis
- `Content Type`: Type of content (Plain Text, HTML, Markdown, JSON)
- `Language`: Language of the content (ISO 639-1 code)
- `Context`: Additional context about the content (optional)
- `Async Processing`: Whether to process protection asynchronously

**Example:**
```json
{
  "contentToProtect": "Hello John Doe, your SSN is 123-45-6789. This content might be toxic!",
  "protectionType": "comprehensive",
  "protectionLevel": "high",
  "returnOriginal": true,
  "includeRiskAnalysis": true,
  "contentType": "text",
  "language": "en",
  "context": "customer support message",
  "asyncProcessing": false
}
```

**Response Example:**
```json
{
  "success": true,
  "protectionId": "prot_abc123",
  "protectedContent": "Hello [REDACTED], your SSN is [REDACTED]. This content has been filtered.",
  "originalContent": "Hello John Doe, your SSN is 123-45-6789. This content might be toxic!",
  "contentLength": 67,
  "protectedContentLength": 65,
  "protectionType": "comprehensive",
  "protectionLevel": "high",
  "modificationsApplied": ["pii_redaction", "toxicity_filtering"],
  "riskScore": 0.85,
  "riskAnalysis": {
    "pii_detected": ["name", "ssn"],
    "toxicity_score": 0.7,
    "bias_score": 0.1,
    "prompt_injection_risk": 0.0
  },
  "statistics": {
    "processing_time_ms": 245,
    "modifications_count": 3,
    "risk_categories": ["pii", "toxicity"]
  }
}
```

## Credentials

To use this node, you need to authenticate with Future AGI. You'll need:

1. A Future AGI account ([Sign up here](https://futureagi.com/signup))
2. API credentials from your Future AGI project settings

### Required Credentials

- **Base URL**: Your Future AGI instance URL (e.g., `https://api.futureagi.com`)
- **API Key**: Your Future AGI API key (format: `fagi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- **Secret Key**: Your Future AGI secret key (format: `fagi_secret_xxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Optional Configuration

- **Organization ID**: Your organization identifier
- **Project ID**: Your project identifier
- **Environment**: Target environment (production, staging, development)
- **Async Settings**: Configure batch sizes, intervals, and retry policies

### Where to find your Future AGI keys

- In the Future AGI web app, go to `Project Settings` → `API Keys` and create a new key pair.
- Copy both the API Key and the Secret Key.
- If you are using a self-hosted or private deployment, confirm the correct `Base URL` (for example, `https://your-company.futureagi.cloud` or your custom domain).

### How to set credentials in n8n

1. Open n8n and navigate to `Credentials` in the left sidebar.
2. Click `+ New` and search for `Future AGI API`.
3. Select `Future AGI API` and fill in the fields:
   - `Base URL`: for example `https://api.futureagi.com`
   - `API Key`: paste your Future AGI API Key
   - `Secret Key`: paste your Future AGI Secret Key
   - (Optional) `Organization ID`, `Project ID`, `Environment`
   - (Optional) Async/Retry settings if you need to tune performance
4. Click `Test` to verify the credentials. A successful test confirms connectivity to `GET /health`.
5. Click `Save`.

### Use credentials in a workflow

- Add a `Future AGI` node to your workflow.
- In the node, select your saved `Future AGI API` credentials.
- Configure the operation (Get Prompt, Log Execution, Run Evaluation, Protect Content) and execute the workflow.

### What the node sends for auth

For transparency, the node uses the following HTTP headers with each request:

- `X-Api-Key: <your API Key>`
- `X-Secret-Key: <your Secret Key>`
- `User-Agent: n8n-futureagi-node/1.0.0`

### Troubleshooting credentials

- **401/403 Unauthorized**: Double-check that both `API Key` and `Secret Key` are correct and active.
- **Wrong Base URL**: If you are self-hosted, ensure the `Base URL` points to your deployment. The default is `https://api.futureagi.com`.
- **Health check fails**: Make sure your network can reach `GET <Base URL>/health` and that your Future AGI service is up.
- **Org/Project access**: If using `Organization ID` or `Project ID`, verify that the key pair has access to them.

## Configuration Options

### Async Logging Configuration

- **Enable Async Logging**: Toggle asynchronous logging (default: true)
- **Logging Batch Size**: Number of entries to batch (default: 10)
- **Logging Flush Interval**: Flush interval in milliseconds (default: 5000)

### Async Evaluation Configuration

- **Enable Async Evaluation**: Toggle asynchronous evaluation (default: true)
- **Evaluation Batch Size**: Number of evaluations to batch (default: 5)
- **Evaluation Poll Interval**: Poll interval in milliseconds (default: 10000)

### Retry Configuration

- **Max Retries**: Maximum retry attempts (default: 3)
- **Retry Delay**: Base delay between retries in milliseconds (default: 1000)
- **Request Timeout**: API request timeout in milliseconds (default: 30000)

## Example Workflows

### Basic Prompt Retrieval and Execution

```json
{
  "nodes": [
    {
      "name": "Get Prompt",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "getPrompt",
        "promptName": "customer-support",
        "promptVersion": "production"
      }
    },
    {
      "name": "Execute AI Model",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "body": {
          "model": "gpt-4",
          "messages": "={{ $json.content }}"
        }
      }
    },
    {
      "name": "Log Execution",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "logExecution",
        "logPromptName": "customer-support",
        "inputData": "={{ $('Get Prompt').item.json }}",
        "outputData": "={{ $json }}"
      }
    }
  ]
}
```

### Advanced Workflow with Multiple Evaluations

```json
{
  "nodes": [
    {
      "name": "Get Prompt with Variables",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "getPrompt",
        "promptName": "personalized-response",
        "templateVariables": {
          "variables": [
            {"key": "user_name", "value": "{{ $json.customer_name }}"},
            {"key": "context", "value": "{{ $json.conversation_context }}"}
          ]
        }
      }
    },
    {
      "name": "Execute AI Model",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "name": "Log and Evaluate",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "logExecution",
        "logPromptName": "personalized-response",
        "inputData": "={{ $('Get Prompt with Variables').item.json }}",
        "outputData": "={{ $('Execute AI Model').item.json }}",
        "metadata": {
          "model": "gpt-4",
          "temperature": 0.7,
          "max_tokens": 500
        }
      }
    },
    {
      "name": "Comprehensive Evaluation",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "runEvaluation",
        "evaluationConfigs": {
          "evaluations": [
            {
              "name": "response-quality",
              "type": "quality",
              "criteria": "{\"accuracy\": 0.85, \"relevance\": 0.9, \"personalization\": 0.8}",
              "thresholds": "{\"minimum_score\": 0.75}",
              "timeout": 30000
            },
            {
              "name": "safety-compliance",
              "type": "safety",
              "criteria": "{\"toxicity\": 0.05, \"bias\": 0.1, \"harmful_content\": 0.05}",
              "thresholds": "{\"maximum_toxicity\": 0.1}",
              "timeout": 25000
            },
            {
              "name": "performance-check",
              "type": "performance",
              "criteria": "{\"response_time\": 2000, \"cost_efficiency\": 0.02}",
              "thresholds": "{\"max_response_time\": 5000}",
              "timeout": 15000
            }
          ]
        },
        "waitForResult": false,
        "parallelExecution": true
      }
    }
  ]
}
```

### Comprehensive Workflow with Content Protection

```json
{
  "nodes": [
    {
      "name": "Get Prompt",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "getPrompt",
        "promptName": "customer-response-template",
        "templateVariables": {
          "variables": [
            {"key": "customer_name", "value": "{{ $json.customer_name }}"},
            {"key": "issue_type", "value": "{{ $json.issue_type }}"}
          ]
        }
      }
    },
    {
      "name": "Execute AI Model",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "name": "Protect AI Response",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "protectContent",
        "contentToProtect": "={{ $('Execute AI Model').item.json.response }}",
        "protectionType": "comprehensive",
        "protectionLevel": "high",
        "returnOriginal": false,
        "includeRiskAnalysis": true,
        "contentType": "text",
        "language": "en",
        "context": "customer support response",
        "asyncProcessing": false
      }
    },
    {
      "name": "Log Execution",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "logExecution",
        "logPromptName": "customer-response-template",
        "inputData": "={{ $('Get Prompt').item.json }}",
        "outputData": "={{ $('Protect AI Response').item.json }}",
        "metadata": {
          "model": "gpt-4",
          "protection_applied": true,
          "risk_score": "={{ $('Protect AI Response').item.json.riskScore }}"
        }
      }
    },
    {
      "name": "Quality Evaluation",
      "type": "@future-agi/n8n-nodes-futureagi.futureAgi",
      "parameters": {
        "operation": "runEvaluation",
        "evaluationConfigs": {
          "evaluations": [
            {
              "name": "response-safety",
              "type": "safety",
              "criteria": "{\"toxicity\": 0.05, \"bias\": 0.1}",
              "thresholds": "{\"maximum_toxicity\": 0.1}",
              "timeout": 20000
            },
            {
              "name": "response-quality",
              "type": "quality",
              "criteria": "{\"helpfulness\": 0.9, \"accuracy\": 0.85}",
              "thresholds": "{\"minimum_score\": 0.8}",
              "timeout": 25000
            }
          ]
        },
        "waitForResult": false,
        "parallelExecution": true
      }
    }
  ]
}
```

## Error Handling

The node includes comprehensive error handling:

- **Automatic Retries**: Failed requests are automatically retried with exponential backoff
- **Graceful Degradation**: Async operations continue even if some requests fail
- **Detailed Error Messages**: Clear error messages for troubleshooting
- **Continue on Fail**: Option to continue workflow execution on errors

## Performance Considerations

### Batch Processing

The node uses intelligent batching to optimize performance:

- **Logging**: Batches log entries to reduce API calls
- **Evaluation**: Groups evaluations for efficient processing
- **Configurable Sizes**: Adjust batch sizes based on your needs

### Async Operations

All logging and evaluation operations are asynchronous by default:

- **Non-blocking**: Workflow execution continues immediately
- **Background Processing**: Operations complete in the background
- **Status Tracking**: Monitor operation status through Future AGI dashboard

## Development

### Prerequisites

- Node.js 18+ and npm
- n8n installed globally: `npm install n8n -g`

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/future-agi/n8n-nodes-futureagi.git
cd n8n-nodes-futureagi
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Link for local testing:
```bash
npm link
cd ~/.n8n/custom
npm link @future-agi/n8n-nodes-futureagi
```

5. Start n8n:
```bash
n8n start
```

### Run n8n via Docker with this node mounted (local dev)

Build the node first so `dist/` exists:
```bash
npm run build
```

Then start n8n in Docker and mount your local node into the custom extensions directory:
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom \
  -v ~/n8n-data:/home/node/.n8n \
  -v /Users/<your-username>/Documents/futureAGI/code/n8n-nodes-futureagi:/home/node/.n8n/custom/@future-agi/n8n-nodes-futureagi:ro \
  docker.n8n.io/n8nio/n8n
```

Notes:
- Replace the second `-v` path with your local repo path. Keep the right side as `/home/node/.n8n/custom/@future-agi/n8n-nodes-futureagi`.
- Keep `:ro` (read-only) to avoid container writes to your source. Rebuild locally and restart the container to pick up changes.
- The `N8N_CUSTOM_EXTENSIONS` env var points n8n to load custom nodes from `/home/node/.n8n/custom`.
- Your n8n data (credentials, workflows) will be stored in `~/n8n-data` on the host.

### Build Commands

- `npm run build`: Build the project
- `npm run dev`: Build and watch for changes
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## API Reference

### Future AGI API Endpoints

The node interacts with the following Future AGI API endpoints:

- `GET /api/v1/prompts/{name}`: Retrieve prompt by name and version
- `POST /api/v1/executions/log`: Log single execution
- `POST /api/v1/executions/batch-log`: Log multiple executions
- `POST /api/v1/evaluations/run`: Run evaluation
- `POST /api/v1/evaluations/batch-submit`: Submit multiple evaluations
- `GET /api/v1/evaluations/{id}`: Get evaluation result
- `GET /api/v1/health`: Health check endpoint

### Response Formats

#### Prompt Response
```json
{
  "id": "prompt_123",
  "name": "customer-support",
  "version": "production",
  "content": "You are a helpful customer support agent...",
  "variables": ["customer_name", "issue_type"],
  "metadata": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Execution Log Response
```json
{
  "success": true,
  "executionId": "exec_456",
  "message": "Execution logged successfully"
}
```

#### Evaluation Response
```json
{
  "evaluationId": "eval_789",
  "status": "completed",
  "score": 0.87,
  "details": {
    "accuracy": 0.9,
    "relevance": 0.85,
    "coherence": 0.86
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify your API key is correct and has proper permissions
- Check that the base URL is accessible
- Ensure your organization and project IDs are valid

**Timeout Issues**
- Increase the request timeout in credentials
- Check network connectivity to Future AGI
- Monitor Future AGI status page for service issues

**Batch Processing Issues**
- Reduce batch sizes if experiencing timeouts
- Increase flush intervals for better performance
- Monitor queue sizes in Future AGI dashboard

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
export DEBUG=n8n-nodes-futureagi:*
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Reporting Issues

Please report issues on our [GitHub Issues](https://github.com/future-agi/n8n-nodes-futureagi/issues) page.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Resources

- [Future AGI Documentation](https://docs.futureagi.com)
- [Future AGI API Reference](https://docs.futureagi.com/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)

## Support

- [Future AGI Support](https://futureagi.com/support)
- [Community Discord](https://discord.gg/futureagi)
- [GitHub Discussions](https://github.com/futureagi/n8n-nodes-futureagi/discussions)

---

**Made with ❤️ by the Future AGI team**
