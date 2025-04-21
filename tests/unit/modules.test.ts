import { createAuthenticatedClient, setupModuleTest } from '../mocks/testHelper';
import { setMockResponse } from '../mocks/rpcMock';
import * as Methods from '../../src/methods';
import { ExploitModule, PayloadModule } from '../../src/module';

describe('Module Manager Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should get module lists', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock responses
    setMockResponse(Methods.ModuleExploits, { 
      modules: ['unix/ftp/vsftpd_234_backdoor', 'windows/smb/ms17_010_eternalblue'] 
    });
    setMockResponse(Methods.ModulePayloads, { 
      modules: ['cmd/unix/interact', 'windows/meterpreter/reverse_tcp'] 
    });
    
    // Call the methods
    const exploits = await client.modules.exploits();
    const payloads = await client.modules.payloads();
    
    // Assertions
    expect(exploits).toEqual(['unix/ftp/vsftpd_234_backdoor', 'windows/smb/ms17_010_eternalblue']);
    expect(payloads).toEqual(['cmd/unix/interact', 'windows/meterpreter/reverse_tcp']);
    
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.ModuleExploits);
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.ModulePayloads);
  });
  
  it('should use an exploit module', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set up mock responses for the specific module
    const moduleInfo = {
      name: 'VSFTPD Backdoor',
      fullname: 'exploit/unix/ftp/vsftpd_234_backdoor',
      description: 'This module exploits a backdoor in VSFTPD 2.3.4',
      targets: { '0': 'Automatic' },
      default_target: 0
    };
    
    const moduleOptions = {
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
        default: 21
      }
    };
    
    // Setup module test helpers
    setupModuleTest('exploit', 'unix/ftp/vsftpd_234_backdoor', moduleInfo, moduleOptions);
    
    // Use a payload module
    setMockResponse(Methods.ModuleTargetCompatiblePayloads, {
      payloads: ['cmd/unix/interact']
    });
    
    // Use the module
    const exploitModule = await client.modules.use('exploit', 'unix/ftp/vsftpd_234_backdoor');
    
    // Assertions
    expect(exploitModule instanceof ExploitModule).toBe(true);
    expect(exploitModule.moduleName).toBe('unix/ftp/vsftpd_234_backdoor');
    expect(exploitModule.info.name).toBe('VSFTPD Backdoor');
    expect(exploitModule.target).toBe(0);
    
    // Test setting options
    exploitModule.setOption('RHOSTS', '192.168.1.123');
    expect(exploitModule.getOption('RHOSTS')).toBe('192.168.1.123');
    
    // Test getting compatible payloads
    const payloads = await exploitModule.targetPayloads();
    expect(payloads).toEqual(['cmd/unix/interact']);
  });
  
  it('should use a payload module', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set up mock responses for the specific module
    const moduleInfo = {
      name: 'Interact with Established Connection',
      fullname: 'payload/cmd/unix/interact',
      description: 'Interacts with a shell on an established socket connection',
    };
    
    const moduleOptions = {
      // Payload options are minimal
      VERBOSE: {
        type: 'bool',
        required: false,
        advanced: true,
        evasion: false,
        desc: 'Enable verbose output',
        default: false
      }
    };
    
    // Setup module test helpers
    setupModuleTest('payload', 'cmd/unix/interact', moduleInfo, moduleOptions);
    
    // Use the module
    const payloadModule = await client.modules.use('payload', 'cmd/unix/interact');
    
    // Assertions
    expect(payloadModule instanceof PayloadModule).toBe(true);
    expect(payloadModule.moduleName).toBe('cmd/unix/interact');
    expect(payloadModule.info.name).toBe('Interact with Established Connection');
  });
  
  it('should execute a module', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set up mock responses for the specific module
    const moduleInfo = {
      name: 'SSH Version Scanner',
      fullname: 'auxiliary/scanner/ssh/ssh_version',
      description: 'Detects SSH version',
      rank: 'normal'
    };
    
    const moduleOptions = {
      RHOSTS: {
        type: 'address',
        required: true,
        advanced: false,
        evasion: false,
        desc: 'The target host(s)'
      }
    };
    
    // Setup module test helpers
    setupModuleTest('auxiliary', 'scanner/ssh/ssh_version', moduleInfo, moduleOptions);
    
    // Mock module execution response
    setMockResponse(Methods.ModuleExecute, {
      job_id: 1,
      uuid: '12345-abcde'
    });
    
    // Use the module
    const auxModule = await client.modules.use('auxiliary', 'scanner/ssh/ssh_version');
    
    // Set required options
    auxModule.setOption('RHOSTS', '192.168.1.123');
    
    // Execute the module
    const result = await auxModule.execute();
    
    // Assertions
    expect(result).toEqual({ job_id: 1, uuid: '12345-abcde' });
    expect(mockRpc.call).toHaveBeenCalledWith(
      Methods.ModuleExecute, 
      ['auxiliary', 'scanner/ssh/ssh_version', expect.objectContaining({ RHOSTS: '192.168.1.123' })]
    );
  });
  
  it('should search for modules', async () => {
    const { client, mockRpc } = await createAuthenticatedClient();
    
    // Set mock response
    setMockResponse(Methods.ModuleSearch, { 
      modules: [
        { fullname: 'exploit/windows/smb/ms17_010_eternalblue', rank: 'excellent' },
        { fullname: 'exploit/windows/smb/smb_login', rank: 'normal' } 
      ]
    });
    
    // Search for modules
    const results = await client.modules.search('smb');
    
    // Assertions
    expect(results).toEqual({ 
      modules: [
        { fullname: 'exploit/windows/smb/ms17_010_eternalblue', rank: 'excellent' },
        { fullname: 'exploit/windows/smb/smb_login', rank: 'normal' } 
      ]
    });
    expect(mockRpc.call).toHaveBeenCalledWith(Methods.ModuleSearch, ['smb']);
  });
  
}); 