#!/usr/bin/env node
/**
 * CLI for tsmsfrpc (Metasploit RPC interactive shell)
 */
const repl = require('repl');
const { TypesploitClient } = require('../lib/index');
const { parseArgs } = require('../lib/utils');

// Parse command-line args
const opts = parseArgs(process.argv.slice(2));
// Instantiate client
const client = new TypesploitClient(opts);
const rpc = client.rpc;
console.log(`Connected to ${opts.server || '127.0.0.1'}:${opts.port || 55553} (ssl=${opts.ssl})`);
console.log('Available as `rpc`');

// Start REPL
const r = repl.start({ prompt: 'msfrpc> ' });
r.context.rpc = rpc;
r.on('exit', () => { console.log('Bye!'); process.exit(0); });