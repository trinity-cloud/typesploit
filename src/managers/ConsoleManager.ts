import { RpcClient } from '../rpc';
import * as Methods from '../methods';
import { ConsoleInfo } from '../types'; // Import ConsoleInfo type
import { MsfConsole } from '../console'; // Import MsfConsole class

/**
 * Manager for Metasploit consoles.
 */
export class ConsoleManager {
  private activeConsoles: Record<string, MsfConsole> = {}; // Cache for console objects

  constructor(private rpc: RpcClient) {}

  /**
   * Create a new console instance.
   * @returns A Promise resolving to the new MsfConsole object.
   */
  async create(): Promise<MsfConsole> {
    const res = await this.rpc.call(Methods.ConsoleCreate);
    const consoleId = res.id;
    if (!consoleId) {
        throw new Error("Failed to create console: No ID received.");
    }
    const newConsole = new MsfConsole(this.rpc, consoleId);
    await newConsole.init(); // Initialize its state
    this.activeConsoles[consoleId] = newConsole; // Add to cache
    return newConsole;
  }

  /**
   * List active consoles.
   * Returns cached objects or creates new ones if needed.
   * @returns A Record mapping console ID (string) to MsfConsole objects.
   */
  async list(): Promise<Record<string, MsfConsole>> {
    const rawConsoles: ConsoleInfo[] = await this.rpc.call(Methods.ConsoleList);
    const updatedConsoles: Record<string, MsfConsole> = {};
    const currentIds = new Set<string>();

    for (const consoleInfo of rawConsoles) {
        currentIds.add(consoleInfo.id);
        if (this.activeConsoles[consoleInfo.id]) {
            // Update state from list info
            this.activeConsoles[consoleInfo.id].busy = consoleInfo.busy;
            this.activeConsoles[consoleInfo.id].prompt = consoleInfo.prompt;
            updatedConsoles[consoleInfo.id] = this.activeConsoles[consoleInfo.id];
        } else {
            // Create new console object (but don't call init again)
            const newConsole = new MsfConsole(this.rpc, consoleInfo.id);
            newConsole.busy = consoleInfo.busy;
            newConsole.prompt = consoleInfo.prompt;
            updatedConsoles[consoleInfo.id] = newConsole;
        }
    }

    // Remove consoles from cache that are no longer active
    for (const cachedId in this.activeConsoles) {
        if (!currentIds.has(cachedId)) {
            delete this.activeConsoles[cachedId];
        }
    }

    // Update the cache
    this.activeConsoles = { ...this.activeConsoles, ...updatedConsoles };
    return { ...this.activeConsoles }; // Return a copy
  }

  /**
   * Get a specific console object by its ID.
   * Fetches the list if the console is not cached.
   * @param cid The console ID string.
   * @returns The MsfConsole object or undefined if not found.
   */
  async console(cid: string): Promise<MsfConsole | undefined> {
      if (this.activeConsoles[cid]) {
          return this.activeConsoles[cid];
      }
      // Refresh list and try again
      await this.list();
      return this.activeConsoles[cid];
  }

  /**
   * Destroy a console by its ID.
   * @param cid The console ID string.
   */
  async destroy(cid: string): Promise<any> {
    const consoleInstance = this.activeConsoles[cid];
    delete this.activeConsoles[cid]; // Remove from cache
    // Call destroy on the instance if available, otherwise call RPC directly
    if (consoleInstance) {
        return consoleInstance.destroy();
    } else {
        return this.rpc.call(Methods.ConsoleDestroy, [cid]);
    }
  }

   // Remove redundant direct methods (read, write, tabs, sessionKill, sessionDetach)
   // as they are now on the MsfConsole objects.
   // The runModuleWithOutput and isBusy methods are also better placed on MsfConsole itself.

}