import { encode as mpEncode, decode as mpDecode } from '@msgpack/msgpack';
import { TextDecoder } from 'util';

/**
 * Encode a JavaScript value into MessagePack.
 */
export function encode(data: any): Uint8Array {
  return mpEncode(data);
}

/**
 * Decode a MessagePack buffer into JavaScript.
 */
export function decode(data: Uint8Array): any {
  return mpDecode(data);
}

/**
 * Recursively convert Uint8Array buffers to UTF-8 strings.
 */
export function convert(obj: any): any {
  if (obj instanceof Uint8Array) {
    return new TextDecoder('utf-8').decode(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(convert);
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convert(v);
    }
    return out;
  }
  return obj;
}
/**
 * Parse CLI args for RPC client.
 * Supports: -P password, -U username, -a server, -p port, -S (disable SSL), --help
 */
export interface CLIOptions {
  password: string;
  username?: string;
  server?: string;
  port?: number;
  ssl?: boolean;
  uri?: string;
  token?: string;
}
export function parseArgs(argv: string[]): CLIOptions {
  const opts: CLIOptions = { password: '' };
  // defaults
  opts.ssl = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-P': opts.password = argv[++i]; break;
      case '-U': opts.username = argv[++i]; break;
      case '-a': opts.server = argv[++i]; break;
      case '-p': opts.port = parseInt(argv[++i], 10); break;
      case '-S': opts.ssl = false; break;
      case '--help':
        console.log('Usage:');
        console.log('  -P <password>   (required)');
        console.log('  -U <username>   (default msf)');
        console.log('  -a <server>     (default 127.0.0.1)');
        console.log('  -p <port>       (default 55553)');
        console.log('  -S              disable SSL (default false)');
        process.exit(0);
      default:
        // ignore unknown
        break;
    }
  }
  if (!opts.password) {
    console.error('Error: password required (-P)');
    process.exit(1);
  }
  return opts;
}