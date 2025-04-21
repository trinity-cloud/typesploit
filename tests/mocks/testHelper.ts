import { RpcClient } from '../../src/rpc';
import { MetasploitClient } from '../../src/index';
import { createMockRpcClient, mockResponses, setMockResponse } from './rpcMock';

// Mock implementations - important to mock before imports
jest.mock('../../src/rpc', () => {
  const { createMockRpcClient } = require('./rpcMock');
  return {
    RpcClient: jest.fn().mockImplementation(() => createMockRpcClient())
  };
});

/**
 * Creates a test MetasploitClient instance with a mocked RPC client
 */
export function createTestClient(): {
  client: MetasploitClient;
  mockRpc: jest.Mocked<RpcClient>;
} {
  const client = new MetasploitClient({
    username: 'test',
    password: 'test',
  });
  
  // Get the automatically created mock RPC client
  const mockRpc = (client as any).rpc;
  
  return { client, mockRpc };
}

/**
 * Creates a pre-authenticated client
 */
export async function createAuthenticatedClient(): Promise<{
  client: MetasploitClient;
  mockRpc: jest.Mocked<RpcClient>;
}> {
  const { client, mockRpc } = createTestClient();
  await client.login();
  return { client, mockRpc };
}

/**
 * Set specific module info and options for module tests
 */
export function setupModuleTest(
  moduleType: string,
  moduleName: string,
  moduleInfo: any,
  moduleOptions: any
): void {
  // Set module info response
  setMockResponse('module.info', {
    type: moduleType,
    name: moduleName,
    fullname: `${moduleType}/${moduleName}`,
    description: `Test ${moduleType} module`,
    ...moduleInfo
  });
  
  // Set module options response
  setMockResponse('module.options', moduleOptions);
} 