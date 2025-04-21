import { RpcClient } from '../rpc';
import * as Methods from '../methods';
import { Workspace } from '../workspace';
import { WorkspaceInfo } from '../types'; // Import WorkspaceInfo type

/** Manage Metasploit workspaces */
export class WorkspaceManager {
  private workspaceCache: Record<string, Workspace> = {}; // Cache Workspace objects

  constructor(private rpc: RpcClient) {}

  /**
   * List all available workspaces.
   * Returns Workspace objects, potentially from cache.
   */
  async list(): Promise<Record<string, Workspace>> {
    const rawWorkspaces: WorkspaceInfo[] = await this.rpc.call(Methods.DbWorkspaces);
    const currentWorkspaces: Record<string, Workspace> = {};
    const currentNames = new Set<string>();

    for (const wsInfo of rawWorkspaces) {
        currentNames.add(wsInfo.name);
        if (this.workspaceCache[wsInfo.name]) {
            // Update info in cache if needed
            // this.workspaceCache[wsInfo.name].info = wsInfo;
            currentWorkspaces[wsInfo.name] = this.workspaceCache[wsInfo.name];
        } else {
            currentWorkspaces[wsInfo.name] = new Workspace(this.rpc, wsInfo.name, wsInfo);
        }
    }

    // Remove stale workspaces from cache
    for (const cachedName in this.workspaceCache) {
        if (!currentNames.has(cachedName)) {
            delete this.workspaceCache[cachedName];
        }
    }

    // Update cache
    this.workspaceCache = { ...this.workspaceCache, ...currentWorkspaces };
    return { ...this.workspaceCache }; // Return a copy
  }

  /**
   * Add a new workspace.
   * @param name The name for the new workspace.
   * @returns The newly created Workspace object.
   */
  async add(name: string): Promise<Workspace> {
    await this.rpc.call(Methods.DbAddWorkspace, [name]);
    // Invalidate cache or fetch new workspace info? For now, just create locally.
    const newWorkspace = new Workspace(this.rpc, name);
    this.workspaceCache[name] = newWorkspace; // Add to cache
    return newWorkspace;
  }

  /**
   * Remove a workspace by name.
   * @param name The name of the workspace to remove.
   */
  async remove(name: string): Promise<any> {
     delete this.workspaceCache[name]; // Remove from cache
     return this.rpc.call(Methods.DbDelWorkspace, [name]);
  }

  /**
   * Set the current active workspace by name.
   * @param name The name of the workspace to activate.
   */
  async set(name: string): Promise<any> {
     // Check if workspace exists? RPC call might fail anyway.
     return this.rpc.call(Methods.DbSetWorkspace, [name]);
  }

  /**
   * Get the currently active workspace.
   * @returns The current Workspace object, or null if fetching fails.
   */
  async current(): Promise<Workspace | null> {
     try {
        const res = await this.rpc.call(Methods.DbCurrentWorkspace);
        const currentName = res.workspace;
        if (!currentName) return null;
        // Return from cache or create new
        return (await this.get(currentName)) || null; // Convert undefined to null
     } catch (error) {
        console.error("Failed to get current workspace:", error);
        return null;
     }
  }

  /**
   * Get a specific Workspace object by name.
   * Fetches the list if not in cache.
   * @param name The name of the workspace.
   * @returns The Workspace object, or undefined if not found.
   */
  async get(name: string): Promise<Workspace | undefined> {
    if (this.workspaceCache[name]) {
        return this.workspaceCache[name];
    }
    // Refresh list and try again
    await this.list();
    return this.workspaceCache[name];
  }

  /**
   * Get a Workspace object by name, creating it if it doesn't exist.
   * @param name Workspace name (defaults to 'default').
   * @returns The existing or newly created Workspace object.
   */
   async workspace(name: string = 'default'): Promise<Workspace> {
        let ws = await this.get(name);
        if (!ws) {
            console.log(`Workspace '${name}' not found, creating...`);
            ws = await this.add(name);
        }
        return ws;
   }
}