import { RpcClient } from '../rpc';
import * as Methods from '../methods';
import { WorkspaceManager } from './WorkspaceManager';
import { Workspace } from '../workspace';

/**
 * Manager for Metasploit database connection and workspace access.
 */
export class DbManager {
  private _workspaceManager: WorkspaceManager;

  constructor(private rpc: RpcClient) {
    this._workspaceManager = new WorkspaceManager(rpc);
  }

  /**
   * Connect to the Metasploit database.
   * @param opts Connection options (username required, others optional).
   */
  async connect(opts: { username: string; database?: string; host?: string; driver?: string; password?: string; port?: number }): Promise<boolean> {
    const res = await this.rpc.call(Methods.DbConnect, [opts]);
    return res.result === 'success';
  }

  /**
   * Get the database driver in use.
   */
  async driver(): Promise<string> {
    const res = await this.rpc.call(Methods.DbDriver, []);
    return res.driver;
  }
  /**
   * Change the database driver.
   */
  async setDriver(driver: string): Promise<any> {
    return this.rpc.call(Methods.DbDriver, [{ driver }]);
  }

  /**
   * Get the status of the database connection.
   */
  async status(): Promise<any> {
    return this.rpc.call(Methods.DbStatus);
  }

  /**
   * Disconnect from the Metasploit database.
   */
  async disconnect(): Promise<any> {
    return this.rpc.call(Methods.DbDisconnect);
  }

  /** Access the high-level workspace manager */
  get workspaces(): WorkspaceManager {
    return this._workspaceManager;
  }

  /**
   * Get the currently active workspace object.
   * Equivalent to client.db.workspace in pymetasploit3.
   */
  get workspace(): Promise<Workspace | null> {
    return this.workspaces.current();
  }

  /**
   * Set the currently active workspace.
   * @param workspace A Workspace object or the name of the workspace.
   */
  set workspace(workspace: Workspace | string | Promise<Workspace | null>) {
    if (workspace instanceof Promise) {
      workspace.then(ws => {
        if (ws) {
          this.workspaces.set(ws.name).catch(err => console.error("Failed to set workspace asynchronously:", err));
        }
      }).catch(err => console.error("Failed to resolve workspace promise for setting:", err));
    } else {
      const workspaceName = typeof workspace === 'string' ? workspace : workspace.name;
      this.workspaces.set(workspaceName).catch(err => console.error(`Failed to set workspace to ${workspaceName}:`, err));
    }
  }
}