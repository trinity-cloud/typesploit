import { createAuthenticatedClient } from '../mocks/testHelper';
import { setMockResponse } from '../mocks/rpcMock';
import * as Methods from '../../src/methods';

describe('Core Manager Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should get version info', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response for version
    const versionData = { 
      version: '6.3.27-dev', 
      ruby: '3.0.4 x86_64-linux 2023-03-30', 
      api: '1.0' 
    };
    setMockResponse(Methods.CoreVersion, versionData);
    
    // Call the method
    const version = await client.core.version();
    
    // Assertions
    expect(version).toEqual(versionData);
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreVersion);
  });
  
  it('should get module stats', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response for module stats
    const statsData = { 
      exploits: 2502, 
      auxiliary: 1290, 
      post: 431, 
      encoders: 49, 
      nops: 13, 
      payloads: 1602 
    };
    setMockResponse(Methods.CoreModuleStats, statsData);
    
    // Call the method
    const stats = await client.core.stats();
    
    // Assertions
    expect(stats).toEqual(statsData);
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreModuleStats);
  });
  
  it('should set global variables', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.CoreSetG, { result: 'success' });
    
    // Call the method
    await client.core.setG('LHOST', '127.0.0.1');
    
    // Assertions
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreSetG, ['LHOST', '127.0.0.1']);
  });
  
  it('should unset global variables', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.CoreUnsetG, { result: 'success' });
    
    // Call the method
    await client.core.unsetG('LHOST');
    
    // Assertions
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreUnsetG, ['LHOST']);
  });
  
  it('should save core state', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.CoreSave, { result: 'success' });
    
    // Call the method
    await client.core.save();
    
    // Assertions
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreSave);
  });
  
  it('should reload modules', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.CoreReloadModules, { result: 'success' });
    
    // Call the method
    await client.core.reload();
    
    // Assertions
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreReloadModules);
  });
  
  it('should list threads', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    const threadsData = { 
      '1': { status: 'running', critical: false, name: 'Regular1' },
      '2': { status: 'running', critical: true, name: 'Critical1' }
    };
    setMockResponse(Methods.CoreThreadList, threadsData);
    
    // Call the method
    const threads = await client.core.threadList();
    
    // Assertions
    expect(threads).toEqual(threadsData);
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreThreadList);
  });
  
  it('should kill a thread', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.CoreThreadKill, { result: 'success' });
    
    // Call the method
    await client.core.threadKill(1);
    
    // Assertions
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreThreadKill, [1]);
  });
  
  it('should add a module path', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.CoreAddModulePath, { result: 'success' });
    
    // Call the method
    await client.core.addModulePath('/path/to/modules');
    
    // Assertions
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.CoreAddModulePath, ['/path/to/modules']);
  });
  
}); 