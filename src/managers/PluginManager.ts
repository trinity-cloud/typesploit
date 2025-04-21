import { RpcClient } from '../rpc';
import * as Methods from '../methods';

/**
 * Manager for Metasploit plugins.
 */
export class PluginManager {
  constructor(private rpc: RpcClient) {}

  async load(name: string): Promise<any> {
    return this.rpc.call(Methods.PluginLoad, [name]);
  }

  async unload(name: string): Promise<any> {
    return this.rpc.call(Methods.PluginUnload, [name]);
  }

  async list(): Promise<any> {
    return this.rpc.call(Methods.PluginLoaded);
  }
}