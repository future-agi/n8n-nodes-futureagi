declare module 'n8n-workflow' {
  export interface IExecuteFunctions {
    getInputData(): any[];
    getNodeParameter(name: string, index: number, fallback?: any): any;
    getCredentials(name: string): Promise<any>;
    continueOnFail(): boolean;
    getExecutionId(): string;
    getNode(): any;
    // Allow calling private helpers in this context
    [key: string]: any;
  }
  export interface INodeExecutionData { json: any; pairedItem?: any }
  export interface INodeType { description: INodeTypeDescription; execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> }
  export interface INodeTypeDescription { [k: string]: any }
  export class NodeOperationError extends Error { constructor(node: any, message: string, options?: any) }
  export interface IAuthenticateGeneric { type: string; properties: any }
  export interface ICredentialTestRequest { request: any; rules?: any[] }
  export interface ICredentialType { name: string; displayName: string; documentationUrl?: string; properties: any[]; authenticate?: IAuthenticateGeneric; test?: ICredentialTestRequest }
  export interface INodeProperties { [k: string]: any }
}

// Removed axios and uuid type declarations - no longer using these dependencies

