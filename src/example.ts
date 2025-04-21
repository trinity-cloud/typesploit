import { MetasploitClient } from './index';
import { 
  MeterpreterSession, 
  ExploitModule, 
  PayloadModule, 
  AuxiliaryModule,
  PostModule,
  EncoderModule,
  NopModule,
  Workspace 
} from './index';
import { MsfAuthError, MsfRpcError } from './errors';

const CONFIG = {
  // Edit these configuration values for your setup
  password: 'your_very_secret_password',
  server: '127.0.0.1',
  port: 55552,
  username: 'msf',
  ssl: true,
  // If you want to test a specific exploit against a target
  target: {
    exploit: 'unix/ftp/vsftpd_234_backdoor',
    payload: 'cmd/unix/interact',
    host: '192.168.1.123',
    port: 21
  }
};

/**
 * Main example function that demonstrates all major functionality
 */
async function main() {
  console.log('=== TypeSploit Comprehensive API Example ===');
  console.log('This example demonstrates the TypeSploit client API\n');
  
  // Create client instance
  console.log('Creating client with password auth...');
  const client = new MetasploitClient({
    password: CONFIG.password,
    server: CONFIG.server,
    port: CONFIG.port,
    username: CONFIG.username,
    ssl: CONFIG.ssl,
  });

  try {
    // AUTHENTICATION
    console.log('\n=== Authentication ===');
    // Log in and get token
    await client.login(); 
    console.log('Successfully authenticated');

    // CORE OPERATIONS
    console.log('\n=== Core Operations ===');
    const version = await client.core.version();
    console.log(`Metasploit version: ${version.version}`);
    
    // Get module stats
    const stats = await client.core.stats();
    console.log('Module Statistics:', stats);
    
    // Set a global variable
    await client.core.setG('LHOST', '127.0.0.1');
    console.log('Set global LHOST to 127.0.0.1');
    
    // Test thread listing
    const threads = await client.core.threadList();
    console.log(`Active threads: ${Object.keys(threads).length}`);

    // MODULE OPERATIONS
    console.log('\n=== Module Operations ===');
    
    // 1. Get module counts
    const exploitCount = (await client.modules.exploits()).length;
    const auxiliaryCount = (await client.modules.auxiliary()).length;
    const postCount = (await client.modules.post()).length;
    const payloadCount = (await client.modules.payloads()).length;
    const encoderCount = (await client.modules.encoders()).length;
    const nopCount = (await client.modules.nops()).length;
    
    console.log(`Module counts - Exploits: ${exploitCount}, Auxiliary: ${auxiliaryCount}, Post: ${postCount}`);
    console.log(`               Payloads: ${payloadCount}, Encoders: ${encoderCount}, NOPs: ${nopCount}`);

    // 2. Test exploit module
    console.log('\n--- Exploit Module Example ---');
    const exploit = await client.modules.use('exploit', CONFIG.target.exploit) as ExploitModule;
    console.log(`Loaded exploit: ${exploit.moduleName}`);
    console.log(`Description: ${exploit.info.description.split('\n')[0]}`);
    console.log(`Required options: ${exploit.required.join(', ')}`);
    console.log(`Targets: ${Object.values(exploit.info.targets || {}).join(', ')}`);
    console.log(`Current target: ${exploit.target}`);

    // Set options
    exploit.setOption('RHOSTS', CONFIG.target.host);
    exploit.setOption('RPORT', CONFIG.target.port);
    console.log(`Set target to ${CONFIG.target.host}:${CONFIG.target.port}`);

    // List payload options
    const compatiblePayloads = await exploit.targetPayloads();
    console.log(`Compatible payloads: ${compatiblePayloads.length}`);
    if (compatiblePayloads.length > 0) {
      console.log(`  Examples: ${compatiblePayloads.slice(0, 3).join(', ')}${compatiblePayloads.length > 3 ? '...' : ''}`);
    }

    // 3. Test payload module
    console.log('\n--- Payload Module Example ---');
    const payload = await client.modules.use('payload', CONFIG.target.payload) as PayloadModule;
    console.log(`Loaded payload: ${payload.moduleName}`);
    console.log(`Required options: ${payload.required.join(', ') || 'None'}`);

    // 4. Test auxiliary module
    console.log('\n--- Auxiliary Module Example ---');
    const auxiliary = await client.modules.use('auxiliary', 'scanner/ssh/ssh_version') as AuxiliaryModule;
    console.log(`Loaded auxiliary: ${auxiliary.moduleName}`);
    console.log(`Description: ${auxiliary.info.description.split('\n')[0]}`);
    console.log(`Required options: ${auxiliary.required.join(', ') || 'None'}`);
    
    // Check if actions exist in the module info
    if (auxiliary.info.actions && Object.keys(auxiliary.info.actions).length > 0) {
      console.log(`Available actions: ${Object.keys(auxiliary.info.actions).join(', ')}`);
      
      // Check if ACTION option exists before trying to access it
      try {
        const currentAction = auxiliary.action;
        if (currentAction) {
          console.log(`Current action: ${currentAction}`);
        }
      } catch (e) {
        console.log('No ACTION option available in this module');
      }
    } else {
      console.log('No actions available for this module');
    }

    // 5. Test encoder module
    console.log('\n--- Encoder Module Example ---');
    const encoder = await client.modules.use('encoder', 'x86/shikata_ga_nai') as EncoderModule;
    console.log(`Loaded encoder: ${encoder.moduleName}`);
    console.log(`Description: ${encoder.info.description.split('\n')[0]}`);

    // 6. Test post module
    console.log('\n--- Post Module Example ---');
    const post = await client.modules.use('post', 'multi/gather/env') as PostModule;
    console.log(`Loaded post module: ${post.moduleName}`);
    console.log(`Description: ${post.info.description.split('\n')[0]}`);
    
    // Check if actions exist in the module info
    if (post.info.actions && Object.keys(post.info.actions).length > 0) {
      console.log(`Available actions: ${Object.keys(post.info.actions).join(', ')}`);
      
      // Check if ACTION option exists before trying to access it
      try {
        const currentAction = post.action;
        if (currentAction) {
          console.log(`Current action: ${currentAction}`);
        }
      } catch (e) {
        console.log('No ACTION option available in this module');
      }
    } else {
      console.log('No actions available for this module');
    }

    // 7. Test nop module
    console.log('\n--- NOP Module Example ---');
    const nop = await client.modules.use('nop', 'x86/single_byte') as NopModule;
    console.log(`Loaded NOP module: ${nop.moduleName}`);
    console.log(`Description: ${nop.info.description.split('\n')[0]}`);

    // 8. Execute an exploit (optional - uncomment if targeting a real system)
    if (false) { // Change to true if you want to run the exploit
      console.log('\n--- Running Exploit ---');
      console.log(`Running exploit ${exploit.moduleName} with payload ${payload.moduleName}...`);
      const exploitResult = await exploit.execute({ payload: payload });
      console.log('Exploit Job ID:', exploitResult.job_id);
      console.log('Exploit UUID:', exploitResult.uuid);
      
      // Wait for session to potentially open
      console.log('Waiting for session...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // SESSION OPERATIONS
    console.log('\n=== Session Operations ===');
    const sessions = await client.sessions.list();
    const sessionCount = Object.keys(sessions).length;
    console.log(`Active Sessions: ${sessionCount}`);

    // List sessions and demonstrate interaction
    if (sessionCount > 0) {
      for (const sid in sessions) {
        const sessionInfo = sessions[sid];
        console.log(`\nSession ${sid}: Type=${sessionInfo.type}, Info=${sessionInfo.info}`);
        
        try {
          // Get a session object
          const session = await client.sessions.session(parseInt(sid));
          
          if (session) {
            // Handle specific session types
            if (session.type === 'meterpreter') {
              console.log('  (Meterpreter Session)');
              // Example commands if you want to interact with the session
              /*
              const sysinfo = await session.runSingleCommand('sysinfo');
              console.log('  System info:', sysinfo);
              */
            } else if (session.type === 'shell') {
              console.log('  (Shell Session)');
              // Example commands if you want to interact with the shell session
              /*
              await session.write('id');
              const output = await session.read();
              console.log('  Command output:', output);
              */
            }
            
            // Get compatible post modules for this session
            const compatModules = await client.modules.compatibleSessions(sid);
            console.log(`  Compatible modules: ${compatModules.length}`);
          }
          
          // You can uncomment this section to stop a session
          /*
          console.log(`  Stopping session ${sid}...`);
          await session.stop();
          console.log(`  Session ${sid} stopped`);
          */
        } catch (e) {
          console.error(`  Error interacting with session ${sid}:`, e);
        }
      }
    } else {
      console.log('No active sessions to demonstrate');
    }

    // JOB OPERATIONS
    console.log('\n=== Job Operations ===');
    const jobs = await client.jobs.list();
    console.log(`Active Jobs: ${Object.keys(jobs).length}`);
    
    for (const jobId in jobs) {
      const job = jobs[jobId];
      console.log(`Job ${jobId}: ${job.name}`);
      
      try {
        // Get job information
        const jobInfo = await client.jobs.info(parseInt(jobId));
        console.log(`  Started at: ${jobInfo.start_time}`);
        
        // You can uncomment this section to stop a job
        /*
        console.log(`  Stopping job ${jobId}...`);
        await client.jobs.stop(jobId);
        console.log(`  Job ${jobId} stopped`);
        */
      } catch (e) {
        console.error(`  Error interacting with job ${jobId}:`, e);
      }
    }

    // CONSOLE OPERATIONS
    console.log('\n=== Console Operations ===');
    try {
      const consolesList = await client.consoles.list();
      console.log(`Active Consoles: ${Array.isArray(consolesList) ? consolesList.length : 'Unknown'}`);
      
      // Create a new console and run commands
      console.log('\nCreating new console...');
      const console1 = await client.consoles.create();
      console.log(`Console created with ID: ${console1.id}`);
      
      // Run several commands to demonstrate console functionality
      const versionOutput = await console1.runCommandAndWait('version');
      console.log('Version command output:', versionOutput.substring(0, 100) + '...');
      
      const helpOutput = await console1.runCommandAndWait('help');
      console.log('Help command output length:', helpOutput.length);
      
      // Test tab completion
      const tabs = await console1.tabs('use exploit/');
      console.log(`Tab completion for 'use exploit/' returned ${tabs.length} options`);
      
      // Destroy the console
      await console1.destroy();
      console.log(`Console ${console1.id} destroyed`);
    } catch (error) {
      console.error('Error in console operations:', error);
      console.log('Skipping console operations due to error');
    }

    // DATABASE OPERATIONS
    console.log('\n=== Database Operations ===');
    
    try {
      // Check database status
      const dbStatus = await client.db.status();
      console.log('Database status:', dbStatus.driver ? `Connected (${dbStatus.driver})` : 'Not connected');
      
      if (dbStatus.driver) { // Only run these if database is connected
        // Workspace operations
        console.log('\n--- Workspace Operations ---');
        const workspaces = await client.db.workspaces.list();
        console.log(`Available workspaces: ${Object.keys(workspaces).join(', ')}`);
        
        // Get current workspace
        const currentWs = await client.db.workspace;
        if (currentWs) {
          console.log(`Current workspace: ${currentWs.name}`);
          
          // Host operations
          const hosts = await currentWs.hosts.list();
          console.log(`Hosts in workspace: ${hosts.length}`);
          
          if (hosts.length > 0) {
            console.log('  Sample hosts:');
            hosts.slice(0, 3).forEach(host => {
              console.log(`    ${host.address} (${host.os_name || 'Unknown OS'})`);
            });
          }
          
          // Service operations
          const services = await currentWs.services.list();
          console.log(`Services in workspace: ${services.length}`);
          
          // Vulnerability operations
          const vulns = await currentWs.vulns.list();
          console.log(`Vulnerabilities in workspace: ${vulns.length}`);
          
          // Create a test workspace
          console.log('\nCreating test workspace...');
          const testWs = await client.db.workspaces.workspace('typesploit_test');
          console.log(`Test workspace "${testWs.name}" ready`);
          
          // Report a test host (uncomment to actually create)
          /*
          await testWs.hosts.report({ 
            host: '192.168.100.100', 
            name: 'test-host',
            os_name: 'Test OS',
            purpose: 'testing'
          });
          console.log('Test host reported to workspace');
          */
          
          // Switch back to original workspace
          await client.db.workspaces.set(currentWs.name);
          console.log(`Switched back to "${currentWs.name}" workspace`);
        } else {
          console.log('No current workspace available');
        }
      }
    } catch (error) {
      console.error('Error in database operations:', error);
      console.log('Skipping database operations due to error');
    }

    // PLUGIN OPERATIONS
    console.log('\n=== Plugin Operations ===');
    const plugins = await client.plugins.list();
    console.log(`Loaded plugins: ${plugins.length ? plugins.join(', ') : 'None'}`);
    
    // You can uncomment this section to load/unload plugins
    /*
    if (!plugins.includes('sounds')) {
      console.log('Loading sounds plugin...');
      await client.plugins.load('sounds');
      console.log('Sounds plugin loaded');
    }
    
    if (plugins.includes('sounds')) {
      console.log('Unloading sounds plugin...');
      await client.plugins.unload('sounds');
      console.log('Sounds plugin unloaded');
    }
    */

    // CLEANUP AND LOGOUT
    console.log('\n=== Cleanup and Logout ===');
    
    // Demonstrate token handling (optional - comment out if client.getToken() isn't available)
    /*
    const token = client.getToken();
    console.log(`Current token: ${token?.substring(0, 8)}...`);
    */
    
    // Log out 
    const logoutSuccess = await client.logout();
    console.log(`Logout ${logoutSuccess ? 'successful' : 'failed'}`);
    
    console.log('\n=== Example Complete ===');

  } catch (error) {
    // ERROR HANDLING
    if (error instanceof MsfAuthError) {
      console.error('\n❌ Authentication Error:', error.message);
    } else if (error instanceof MsfRpcError) {
      console.error('\n❌ RPC Error:', error.message);
    } else {
      console.error('\n❌ Unexpected Error:', error);
    }
  }
}

// Run the main example function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});