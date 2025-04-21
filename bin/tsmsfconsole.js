#!/usr/bin/env node
/**
 * CLI for tsmsfconsole (Metasploit msfconsole-like shell)
 */
const repl = require('repl');
const { TypesploitClient } = require('../lib/index');
const { MsfRpcConsole } = require('../lib/console');
const { parseArgs } = require('../lib/utils');

(async () => {
  // Parse args and init client
  const opts = parseArgs(process.argv.slice(2));
  const client = new TypesploitClient(opts);
  // Create RPC console with data callback
  const msfCon = await MsfRpcConsole.create(client.rpc, d => process.stdout.write(d.data));
  // Start REPL interpreting input as msf commands
  const r = repl.start({
    prompt: msfCon['prompt'] || 'msf> ',
    eval: (cmd, context, filename, callback) => {
      const line = cmd.trim();
      if (!line) return callback(null, '');
      msfCon.write(line).then(() => callback(null, '')).catch(err => callback(err));
    }
  });
  r.on('exit', () => {
    msfCon.destroy();
    process.exit(0);
  });
})();