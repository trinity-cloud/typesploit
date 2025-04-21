import { RpcClient } from '../../src/rpc';
import * as Methods from '../../src/methods';

/**
 * Mock response data for various RPC calls
 */
export const mockResponses: Record<string, any> = {
  // Auth responses
  [Methods.AuthLogin]: { result: 'success', token: 'MOCK_TOKEN_12345' },
  [Methods.AuthLogout]: { result: 'success' },
  [Methods.AuthTokenList]: { tokens: ['MOCK_TOKEN_12345', 'ANOTHER_TOKEN'] },
  
  // Core responses
  [Methods.CoreVersion]: { version: '6.3.27-dev', ruby: '3.0.4 x86_64-linux 2023-03-30', api: '1.0' },
  [Methods.CoreModuleStats]: { 
    exploits: 2502, auxiliary: 1290, post: 431, 
    encoders: 49, nops: 13, payloads: 1602 
  },
  [Methods.CoreThreadList]: { '1': { status: 'running', critical: false, name: 'Regular1' } },

  // Module responses
  [Methods.ModuleExploits]: { modules: ['unix/ftp/vsftpd_234_backdoor', 'windows/smb/ms17_010_eternalblue'] },
  [Methods.ModuleAuxiliary]: { modules: ['scanner/ssh/ssh_version', 'scanner/http/dir_scanner'] },
  [Methods.ModulePost]: { modules: ['multi/gather/env', 'windows/gather/credentials/chrome'] },
  [Methods.ModulePayloads]: { modules: ['cmd/unix/interact', 'windows/meterpreter/reverse_tcp'] },
  [Methods.ModuleEncoders]: { modules: ['x86/shikata_ga_nai', 'cmd/powershell_base64'] },
  [Methods.ModuleNops]: { modules: ['x86/single_byte', 'x64/simple'] },
  [Methods.ModulePlatforms]: ['windows', 'linux', 'osx', 'android', 'ios'],
  
  // Session responses
  [Methods.SessionList]: { 
    '1': { 
      type: 'meterpreter', 
      tunnel_local: '127.0.0.1:4444', 
      tunnel_peer: '192.168.1.123:12345',
      via_exploit: 'exploit/multi/handler',
      via_payload: 'payload/windows/meterpreter/reverse_tcp',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      info: 'Computer\\User @ Windows 10',
      workspace: 'default'
    }
  },
  
  // Job responses
  [Methods.JobList]: { 
    '1': { 
      name: 'Exploit: unix/webapp/test',
      start_time: 1619712000,
      datastore: { RHOST: '192.168.1.123' }
    }
  },
  
  // Console responses
  [Methods.ConsoleList]: { 
    consoles: [
      { id: 'console-1', prompt: 'msf6 > ', busy: false }
    ]
  },
  [Methods.ConsoleCreate]: { id: 'new-console-123', prompt: 'msf6 > ', busy: false },
  [Methods.ConsoleRead]: { data: 'Sample console output\nMSF version 6.3.27-dev\n', prompt: 'msf6 > ', busy: false },
  [Methods.ConsoleWrite]: { wrote: true },
  [Methods.ConsoleTabs]: { tabs: ['use', 'back', 'exploit/', 'auxiliary/'] },
  
  // Database responses
  [Methods.DbStatus]: { driver: 'postgresql', db: 'msf' },
  [Methods.DbWorkspaces]: [
    { id: 1, name: 'default', created_at: '2023-01-01T00:00:00Z' },
    { id: 2, name: 'project1', created_at: '2023-01-02T00:00:00Z' }
  ],
  [Methods.DbCurrentWorkspace]: { workspace: 'default' },
  
  // Plugin responses
  [Methods.PluginLoaded]: { plugins: ['sounds', 'db_tracker'] },
  
  // Default module responses - will be overridden for specific tests
  [Methods.ModuleInfo]: {
    type: 'exploit',
    name: 'Test Exploit',
    fullname: 'exploit/test/module',
    description: 'Test module description',
    license: 'MSF_LICENSE',
    rank: 'normal',
    references: [],
    targets: { '0': 'Automatic' },
    default_target: 0,
    default_action: 'scan'
  },
  [Methods.ModuleOptions]: {
    RHOSTS: {
      type: 'address',
      required: true,
      advanced: false,
      evasion: false,
      desc: 'The target host(s)'
    },
    RPORT: {
      type: 'port',
      required: true,
      advanced: false,
      evasion: false,
      desc: 'The target port',
      default: 80
    },
    TARGET: {
      type: 'integer',
      required: false,
      advanced: false,
      evasion: false,
      desc: 'Target index',
      default: 0
    },
    ACTION: {
      type: 'string',
      required: false,
      advanced: false,
      evasion: false,
      desc: 'The action to perform',
      default: 'scan'
    }
  },
  [Methods.ModuleTargetCompatiblePayloads]: { payloads: ['cmd/unix/interact'] },
  [Methods.ModuleCompatibleSessions]: { modules: ['post/test/module'] },
  [Methods.ModuleSearch]: { 
    modules: [
      { fullname: 'exploit/windows/smb/ms17_010_eternalblue', rank: 'excellent' },
      { fullname: 'exploit/windows/smb/smb_login', rank: 'normal' } 
    ]
  },
  [Methods.ModuleExecute]: { job_id: 1, uuid: '12345-abcde' },
  
  // Session responses
  [Methods.SessionMeterpreterRead]: { data: 'meterpreter > ' },
  [Methods.SessionMeterpreterWrite]: { result: 'success' },
  [Methods.SessionMeterpreterRunSingle]: { result: 'success' },
  [Methods.SessionMeterpreterTabs]: { tabs: ['sysinfo', 'getuid', 'help'] },
  [Methods.SessionShellRead]: { data: '$ ' },
  [Methods.SessionShellWrite]: { result: 'success' }
};

/**
 * Creates a mock RPC client for testing
 */
export function createMockRpcClient(): jest.Mocked<RpcClient> {
  let currentToken = 'MOCK_TOKEN_12345';
  
  const callMock = jest.fn().mockImplementation((method: string, args: any[] = [], isRaw: boolean = false) => {
    console.log(`Mock RPC call: ${method}`);
    
    // Special handling for auth.login
    if (method === Methods.AuthLogin) {
      return Promise.resolve(mockResponses[method]);
    }
    
    // Handle auth.logout specially
    if (method === Methods.AuthLogout) {
      // In tests, we expect the token as the first arg
      if (args && args.length > 0) {
        // Validate it's the mock token we expect
        const token = args[0];
        if (token !== currentToken) {
          return Promise.resolve({ 
            error: true,
            error_message: 'Invalid token'
          });
        }
      }
      return Promise.resolve(mockResponses[method]);
    }
    
    // Return the mock response for other methods
    if (mockResponses[method]) {
      return Promise.resolve(mockResponses[method]);
    }
    
    // Default response if method not mocked
    console.warn(`Warning: No mock response for method: ${method}`);
    return Promise.resolve({});
  });
  
  const getTokenMock = jest.fn(() => currentToken);
  
  return {
    call: callMock,
    getToken: getTokenMock
  } as unknown as jest.Mocked<RpcClient>;
}

/**
 * Set a custom mock response for a specific method call
 */
export function setMockResponse(method: string, response: any): void {
  mockResponses[method] = response;
}

/**
 * Reset all mock responses to their default values
 */
export function resetMockResponses(): void {
  // Reset would re-initialize the mockResponses object
  // For now, we'll leave this as a placeholder
} 