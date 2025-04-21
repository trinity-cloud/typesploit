// Quickstart Example - Basic Metasploit RPC usage
import { MetasploitClient } from '../src/index';

(async () => {
  // Instantiate client with required password
  const client = new MetasploitClient({ password: 'YOUR_PASSWORD' });
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