import { RpcClient } from './rpc';
import * as Methods from './methods';
import {
    HostsTable, ServicesTable, VulnsTable, NotesTable,
    LootsTable, CredsTable, EventsTable, ClientsTable
} from './db_table';
import { WorkspaceInfo } from './types';
import * as fs from 'fs/promises'; // For file import

/**
 * Represents a Metasploit Workspace.
 * Provides access to database tables scoped to this workspace.
 */
export class Workspace {
    private _hosts: HostsTable;
    private _services: ServicesTable;
    private _vulns: VulnsTable;
    private _notes: NotesTable;
    private _loots: LootsTable;
    private _creds: CredsTable;
    private _events: EventsTable;
    private _clients: ClientsTable;

    constructor(
        private rpc: RpcClient,
        public readonly name: string,
        // Optional: Store full WorkspaceInfo if needed later
        public readonly info?: WorkspaceInfo 
    ) {
        // Initialize table accessors
        this._hosts = new HostsTable(rpc, name);
        this._services = new ServicesTable(rpc, name);
        this._vulns = new VulnsTable(rpc, name);
        this._notes = new NotesTable(rpc, name);
        this._loots = new LootsTable(rpc, name);
        this._creds = new CredsTable(rpc, name);
        this._events = new EventsTable(rpc, name);
        this._clients = new ClientsTable(rpc, name);
    }

    /** Access the Hosts table for this workspace. */
    get hosts(): HostsTable { return this._hosts; }

    /** Access the Services table for this workspace. */
    get services(): ServicesTable { return this._services; }

    /** Access the Vulnerabilities table for this workspace. */
    get vulns(): VulnsTable { return this._vulns; }

    /** Access the Notes table for this workspace. */
    get notes(): NotesTable { return this._notes; }

    /** Access the Loots table for this workspace. */
    get loots(): LootsTable { return this._loots; }

    /** Access the Credentials table for this workspace. */
    get creds(): CredsTable { return this._creds; }

    /** Access the Events table for this workspace. */
    get events(): EventsTable { return this._events; }

    /** Access the Clients table for this workspace. */
    get clients(): ClientsTable { return this._clients; }

    /**
     * Delete this workspace from the database.
     */
    async delete(): Promise<any> {
        // Note: db.del_workspace takes names, not just { workspace: name }
        return this.rpc.call(Methods.DbDelWorkspace, [this.name]);
    }

    /**
     * Import data into this workspace.
     * @param data Base64 encoded data string.
     * @param options Optional import options (e.g., { preserve_hosts: true }).
     */
    async importData(data: string, options: Record<string, any> = {}): Promise<any> {
        const importOptions = {
            workspace: this.name,
            data: data,
            ...options
        };
        return this.rpc.call(Methods.DbImportData, [importOptions]);
    }

    /**
     * Import data from a file into this workspace.
     * Reads the file, base64 encodes it, and calls importData.
     * @param filePath Absolute path to the file to import.
     * @param options Optional import options.
     */
    async importFile(filePath: string, options: Record<string, any> = {}): Promise<any> {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const base64Data = fileBuffer.toString('base64');
            return this.importData(base64Data, options);
        } catch (error: any) {
            throw new Error(`Failed to read or import file ${filePath}: ${error.message}`);
        }
    }

     /**
     * Set this workspace as the current active workspace for the RPC connection.
     * Note: This affects subsequent calls on the DbManager that rely on the current workspace.
     */
     async setCurrent(): Promise<any> {
        return this.rpc.call(Methods.DbSetWorkspace, [this.name]);
     }
}