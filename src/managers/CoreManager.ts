import { RpcClient } from '../rpc';
import * as Methods from '../methods';

/**
 * Core Metasploit framework manager.
 */
export class CoreManager {
  constructor(private rpc: RpcClient) {}

  /**
   * Get Metasploit core version.
   */
  async version(): Promise<any> {
    return this.rpc.call(Methods.CoreVersion);
  }

  /**
   * Stop the Metasploit core.
   */
  async stop(): Promise<any> {
    return this.rpc.call(Methods.CoreStop);
  }

  /**
   * Set a global variable (core.setg).
   */
  async setG(key: string, value: any): Promise<any> {
    return this.rpc.call(Methods.CoreSetG, [key, value]);
  }

  /**
   * Unset a global variable (core.unsetg).
   */
  async unsetG(key: string): Promise<any> {
    return this.rpc.call(Methods.CoreUnsetG, [key]);
  }

  /**
   * Save the current core state.
   */
  async save(): Promise<any> {
    return this.rpc.call(Methods.CoreSave);
  }

  /**
   * Reload all modules in the core.
   */
  async reload(): Promise<any> {
    return this.rpc.call(Methods.CoreReloadModules);
  }

  /**
   * Get module statistics from the core.
   */
  async stats(): Promise<any> {
    return this.rpc.call(Methods.CoreModuleStats);
  }

  /**
   * Add a search path for additional modules.
   */
  async addModulePath(path: string): Promise<any> {
    return this.rpc.call(Methods.CoreAddModulePath, [path]);
  }

  /**
   * List current threads running in the core.
   */
  async threadList(): Promise<any> {
    return this.rpc.call(Methods.CoreThreadList);
  }

  /**
   * Kill a thread running in the core.
   */
  async threadKill(threadId: number): Promise<any> {
    return this.rpc.call(Methods.CoreThreadKill, [threadId]);
  }
}