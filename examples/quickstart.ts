// Quickstart Example - Basic Metasploit RPC usage
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
  // Instantiate client with required password
  const client = new MetasploitClient({ 
    password: CONFIG.password,
    server: CONFIG.server,
    port: CONFIG.port,
    username: CONFIG.username,
    ssl: CONFIG.ssl,
  });
  try {
    // Authenticate
    await client.login();
    console.log('Authenticated successfully');

    // Fetch and display core version
    const versionInfo = await client.core.version();
    console.log('Metasploit Version:', versionInfo.version);
    console.log('API Version:', versionInfo.api);
  } catch (error) {
    console.error('Error during quickstart:', error);
  } finally {
    // Logout and cleanup
    await client.logout();
    console.log('Logged out');
  }
})(); 