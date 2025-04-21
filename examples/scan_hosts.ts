// scan_hosts.ts - Example: Report and list hosts in a workspace
import { MetasploitClient } from '../src/index';

(async () => {
  const client = new MetasploitClient({ password: 'YOUR_PASSWORD' });
  try {
    await client.login();
    console.log('Connected, managing hosts...');

    // Get or create a workspace
    const ws = await client.db.workspaces.workspace('default');
    console.log(`Current workspace: ${ws.name}`);

    // Report a new host to the database
    await ws.hosts.report({
      host: '192.168.1.100',
      name: 'ExampleHost',
      os_name: 'Linux'
    });
    console.log('Host reported: 192.168.1.100');

    // List all hosts in this workspace
    const hosts = await ws.hosts.list();
    console.log('Hosts in workspace:', hosts.map(h => h.address));
  } catch (error) {
    console.error('Error in scan_hosts example:', error);
  } finally {
    await client.logout();
    console.log('Logged out');
  }
})(); 