# typesploit - TypeScript Metasploit RPC Client

`typesploit` is a TypeScript library designed to interact with the Metasploit RPC (MSGRPC) service. It provides an object-oriented interface inspired by `pymetasploit3`, enabling developers to control and automate Metasploit tasks programmatically from TypeScript or JavaScript environments, such as Node.js applications or VSCode extensions.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup Metasploit RPC Server](#setup-metasploit-rpc-server)
- [Environment & Configuration](#environment--configuration)
- [Quickstart](#quickstart)
- [Basic Usage](#basic-usage)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Roadmap](#roadmap)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Support](#support)


## Features

*   Connects to remote or local `msfrpcd` instances.
*   Provides managers for interacting with core Metasploit components:
    *   Modules (Exploits, Payloads, Auxiliary, Post, Encoders, Nops)
    *   Sessions (Meterpreter, Shell)
    *   Database (Workspaces, Hosts, Services, Vulns, Notes, Loot, Creds, Events, Clients)
    *   Consoles
    *   Jobs
    *   Core Functions
    *   Authentication Tokens
    *   Plugins
*   Object-oriented wrappers for Modules, Sessions, Workspaces, Tables, and Consoles.
*   Type safety via TypeScript definitions.
*   Async/Await based API.
*   Custom error types for better error handling.

## Installation

```bash
# Install from npm (when published)
npm install typesploit

# Install from repository
npm install git+https://github.com/trinity-cloud/typesploit.git

# Ensure you have peer dependencies
npm install node-fetch @msgpack/msgpack
```

+ ## Prerequisites
+
+ - Node.js >= 14
+ - Peer dependencies:
+   - `node-fetch`
+   - `@msgpack/msgpack`

## Setup Metasploit RPC Server

Before using this library, you need to start the Metasploit RPC server:

```bash
# Starting msfrpcd from command line
msfrpcd -P password -S -a 127.0.0.1

# Or from within msfconsole
load msgrpc Pass=password ServerHost=127.0.0.1 ServerPort=55553
```

## Quickstart

A minimal example to get you going quickly:

```typescript
import { MetasploitClient } from 'typesploit';

(async () => {
  const client = new MetasploitClient({ password: 'YOUR_SECRET' });
  await client.login();
  console.log('Core version:', (await client.core.version()).version);
  await client.logout();
})();
```

## Examples

Browse the `examples/` folder for more complete usage scenarios, such as scanning hosts, running exploits, and automating workflows.

## Basic Usage

```typescript
import { MetasploitClient } from 'typesploit';
import { MeterpreterSession, ExploitModule, PayloadModule, Workspace } from 'typesploit';
import { MsfAuthError } from 'typesploit/errors';

async function main() {
  const client = new MetasploitClient({
    password: 'your_msfrpcd_password',
    // Optional parameters:
    // server: '127.0.0.1',
    // port: 55553,
    // username: 'msf',
    // token: 'your_existing_token', // Provide token OR user/pass
    // ssl: false,
  });

  try {
    // Connect and authenticate (implicitly called on first operation if needed, or call explicitly)
    await client.login();
    console.log('Connected and Authenticated!');
    console.log('Core Version:', await client.core.version());

    // --- Modules ---
    console.log('\n--- Modules ---');
    const exploit = await client.modules.use('exploit', 'unix/ftp/vsftpd_234_backdoor') as ExploitModule;
    const payload = await client.modules.use('payload', 'cmd/unix/interact') as PayloadModule;

    exploit.setOption('RHOSTS', '192.168.1.123'); // Set target IP
    exploit.setOption('RPORT', 21);

    console.log(`Running exploit ${exploit.moduleName} with payload ${payload.moduleName}...`);
    const exploitResult = await exploit.execute({ payload: payload }); // Pass payload to execute
    console.log('Exploit Job ID:', exploitResult.job_id);
    console.log('Exploit UUID:', exploitResult.uuid);
    
    // Wait a bit for session to potentially open
    await new Promise(resolve => setTimeout(resolve, 5000));

    // --- Sessions ---
    console.log('\n--- Sessions ---');
    const sessions = await client.sessions.list();
    console.log('Active Sessions:', Object.keys(sessions).length);

    for (const sid in sessions) {
      const session = sessions[sid];
      console.log(`Session ${sid}: Type=${session.info.type}, Info=${session.info.info}`);
      
      if (session instanceof MeterpreterSession) {
          console.log('  (Meterpreter Session)');
          // Example: Get directory separator
          // const sep = await session.getDirectorySeparator();
          // await session.write(`ls /tmp${sep}`);
          // const output = await session.read();
          // console.log(output.data);
      } else {
         console.log(' (Shell/Other Session)');
         // Example: Run whoami
         // const output = await session.runWithOutput('whoami', ['\n']); // Using helper
         // console.log('whoami output:', output);
      }
      // Stop the session
      // await session.stop();
      // console.log(`Session ${sid} stopped.`);
    }

    // --- Database & Workspaces ---
    console.log('\n--- Database --- ');
    const currentWs: Workspace | null = await client.db.workspace; // Get current workspace object
    if (currentWs) {
        console.log(`Current Workspace: ${currentWs.name}`);
        const hosts = await currentWs.hosts.list();
        console.log(`Hosts in ${currentWs.name}:`, hosts.length);
        // hosts.forEach(h => console.log(`  - ${h.address} (${h.os_name || 'Unknown OS'})`));
        
        // Report a host
        // await currentWs.hosts.report({ host: '192.168.1.111', name: 'Test Host from typesploit' });
    }

    // Get/Create another workspace
    const projectWs = await client.db.workspaces.workspace('typesploit_test');
    console.log(`Using workspace: ${projectWs.name}`);
    // List services in this workspace
    // const services = await projectWs.services.list();
    // console.log('Services:', services.length);

    // --- Consoles ---
    console.log('\n--- Consoles ---');
    const console1 = await client.consoles.create();
    console.log(`Created Console ID: ${console1.id}`);
    const versionOutput = await console1.runCommandAndWait('version');
    console.log('Console Version Output:', versionOutput);
    await console1.destroy();
    console.log(`Console ${console1.id} destroyed.`);

  } catch (error) {
    if (error instanceof MsfAuthError) {
        console.error('Authentication Failed:', error.message);
    } else {
        console.error('An error occurred:', error);
    }
  } finally {
    // Optional: Logout or clean up
     await client.logout(); 
  }
}

main();
```

## API Overview

The main entry point is the `MetasploitClient` class. After instantiation and authentication, you access different functionalities through manager properties:

### `client.core` (CoreManager)
Handles core Metasploit functions.
*   `version()`: Get Metasploit framework version info.
*   `stop()`: Stop the Metasploit RPC server.
*   `setg(variable, value)`: Set a global datastore option.
*   `unsetg(variable)`: Unset a global datastore option.
*   `save()`: Save the global datastore.
*   `reloadModules()`: Reload modules.
*   `moduleStats()`: Get module counts.
*   `addModulePath(path)`: Add a path to search for modules.
*   `threadList()`: List running framework threads.
*   `threadKill(tid)`: Kill a framework thread.

### `client.auth` (AuthManager)
Manages authentication tokens.
*   `login(user, pass)`: Handled implicitly or explicitly by `MetasploitClient.login()`.
*   `logout()`: Logs out the current session (invalidates temporary token).
*   `tokenList()`: List API tokens.
*   `tokenAdd(token)`: Add a persistent token.
*   `tokenGenerate()`: Generate a new temporary token.
*   `tokenRemove(token)`: Remove a persistent token.

### `client.modules` (ModuleManager)
Manages and interacts with Metasploit modules.
*   `exploits()`, `payloads()`, `auxiliary()`, `post()`, `encoders()`, `nops()`, `evasion()`: List available module names of the specified type.
*   `platforms()`: List supported module platforms.
*   `search(keyword)`: Search modules.
*   `info(type, name)`, `infoHtml(type, name)`: Get module metadata.
*   `options(type, name)`: Get module options structure.
*   `compatibleSessions(name)`, `compatiblePayloads(type, name)`, `targetCompatiblePayloads(type, name, target)`: Find compatible items.
*   `use(type, name)`: **Primary method** - Gets an initialized module object (`ExploitModule`, `PayloadModule`, etc.).

### Module Objects (MsfModule, ExploitModule, PayloadModule, etc.)
Returned by `client.modules.use()`.
*   `info`: (Getter) Module metadata.
*   `options`: (Getter) List of option names.
*   `required`: (Getter) List of required option names.
*   `missingRequired`: (Getter) List of unset required options.
*   `runOptions`: (Getter) Current option values set for execution.
*   `optionInfo(name)`: Get details for a specific option.
*   `getOption(name)`, `setOption(name, value)`, `updateOptions(record)`: Manage run options.
*   `execute(extraOptions?)`: Execute the module (handles payload logic for exploits).
*   `check(extraOptions?)`: Run the module's check method.
*   **(ExploitModule Specific)**
    *   `payloads`: (Getter) Compatible payload names.
    *   `target`: (Getter/Setter) Current target ID.
    *   `targetPayloads()`: Get payloads compatible with the current target.
*   **(PayloadModule Specific)**
    *   `generate()`: Generate the payload raw output.
*   **(AuxiliaryModule/PostModule Specific)**
    *   `action`: (Getter/Setter) Current action.

### `client.sessions` (SessionManager)
Manages active sessions.
*   `list()`: List active sessions, returning session objects keyed by numeric ID.
*   `session(sid)`: Get a specific session object by ID.
*   `meterpreter(sid)`, `shell(sid)`: Get specific session type or throw error.
*   `stop(sid)`: Stop a session.

### Session Objects (MsfSession, MeterpreterSession, ShellSession)
Returned by `client.sessions.list()` or `client.sessions.session()`.
*   `id`: Session ID (number).
*   `info`: Raw session information.
*   `type`: Session type string.
*   `uuid`: Session UUID.
*   `stop()`: Stop the session.
*   `compatibleModules()`: List compatible modules.
*   `read()`: Read output (specific implementation per type).
*   `write(data)`: Write command/data (specific implementation per type).
*   `runCommandWithOutput(cmd, prompts, timeout)`: Helper to run command and wait for prompts.
*   `runWithOutput(cmd, prompts, timeout)`: Simpler interface for the above.
*   **(Meterpreter Specific)**
    *   `ring`: `SessionRing` object for ring buffer interaction.
    *   `detach()`, `kill()`, `tabs(line)`, `runSingle(cmd)`, `runScript(name)`, `getDirectorySeparator()`.
*   **(Shell Specific)**
    *   `upgrade(lhost, lport)`: Attempt to upgrade to Meterpreter.

### `client.db` (DbManager)
Manages database connection and provides access to workspaces.
*   `connect(opts)`, `disconnect()`, `status()`, `driver()`, `setDriver(name)`: Manage DB connection.
*   `workspaces`: (Getter) Access the `WorkspaceManager`.
*   `workspace`: (Getter/Setter) Get or set the current active `Workspace` object.

### `client.db.workspaces` (WorkspaceManager)
Manages workspaces.
*   `list()`: List available workspace objects keyed by name.
*   `add(name)`: Add a new workspace.
*   `remove(name)`: Remove a workspace.
*   `set(name)`: Set the current active workspace by name.
*   `current()`: Get the current active workspace object.
*   `get(name)`: Get a specific workspace object by name.
*   `workspace(name)`: Get a workspace object, creating it if it doesn't exist.

### Workspace Objects (Workspace)
Returned by `WorkspaceManager` methods. Represents a single workspace.
*   `name`: Workspace name.
*   `info`: Raw workspace info (optional).
*   `hosts`, `services`, `vulns`, `notes`, `loots`, `creds`, `events`, `clients`: (Getters) Access table manager objects scoped to this workspace.
*   `delete()`: Delete the workspace.
*   `importData(base64Data, opts)`: Import base64 encoded data.
*   `importFile(filePath, opts)`: Import data from a file.
*   `setCurrent()`: Set this workspace as the active one.

### Table Objects (HostsTable, ServicesTable, etc.)
Accessed via getters on a `Workspace` object (e.g., `workspace.hosts`).
*   `list(options?)`: List records in the table, with filtering options.
*   `report(attributes)`: Add or update a record.
*   `delete(attributes)`: Delete records matching criteria.
*   `get(attributes)`: Get a single record matching criteria.
*   `update(attributes)`: Alias for `report`.

### `client.consoles` (ConsoleManager)
Manages interactive consoles.
*   `create()`: Create a new console.
*   `list()`: List active console objects keyed by ID.
*   `console(cid)`: Get a specific console object.
*   `destroy(cid)`: Destroy a console.

### Console Objects (MsfConsole)
Returned by `ConsoleManager` methods.
*   `id`: Console ID string.
*   `prompt`: Current prompt string.
*   `busy`: Current busy status.
*   `init()`: Initialize console state.
*   `read()`: Read pending output.
*   `write(command)`: Write a command.
*   `isBusy()`: Check if busy (refreshes state).
*   `tabs(line)`: Get tab completions.
*   `sessionDetach()`, `sessionKill()`: Interact with attached session.
*   `destroy()`: Destroy the console.
*   `runCommandAndWait(cmd, timeout)`: Helper to run command and wait for prompt.
*   `runModuleWithOutput(...)`: Helper to run a module via console commands.

### `client.jobs` (JobManager)
Manages background jobs.
*   `list()`: List active jobs.
*   `stop(jobId)`: Stop a job.
*   `info(jobId)`: Get info for a specific job ID.
*   `infoByUuid(uuid)`: Get info for a job by its UUID (filters list).

### `client.plugins` (PluginManager)
Manages server plugins.
*   `listLoaded()`: List loaded plugins.
*   `load(pluginName, opts?)`: Load a plugin.
*   `unload(pluginName)`: Unload a plugin.

## Testing

The library includes tests using Jest to ensure functionality. To run tests:

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## Error Handling

The library uses custom error classes inheriting from `TypesploitError`:
*   `MsfRpcError`: General RPC communication error.
*   `MsfAuthError`: Authentication failure.
*   `MsfTimeoutError`: Operation timed out (e.g., waiting for session output).
*   `ValueError`: Invalid value provided (e.g., for a module option).
*   `NotFoundError`: Resource (session, console, etc.) not found.

Catch these specific errors for more granular control flow.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License

## Acknowledgements

This library was inspired by the [pymetasploit3](https://github.com/DanMcInerney/pymetasploit3) Python library.

## Support

Have questions or need help? Please file an issue on GitHub: https://github.com/trinity-cloud/typesploit/issues