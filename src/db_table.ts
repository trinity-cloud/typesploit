import { RpcClient } from './rpc';
import * as Methods from './methods';
import {
    DbListFilterOptions,
    HostInfo, HostListOptions,
    ServiceInfo, ServiceListOptions,
    VulnInfo, VulnListOptions,
    NoteInfo, NoteListOptions,
    LootInfo, LootListOptions,
    CredInfo, CredListOptions,
    EventInfo, EventListOptions,
    ClientInfo, ClientListOptions
} from './types';

// Type for generic attribute records used in report/delete/get
type DbAttributeRecord = Record<string, any>;

/**
 * Base class for interacting with specific database tables within a workspace.
 */
export abstract class MsfTable<TInfo, TListOptions extends DbListFilterOptions> {
    protected abstract readonly tableNamePlural: string; // e.g., 'hosts', 'services'
    protected abstract readonly tableNameSingular: string; // e.g., 'host', 'service'

    constructor(protected rpc: RpcClient, protected workspaceName: string) {}

    /** Helper to ensure options include the current workspace name */
    protected addWorkspace(options: Record<string, any>): Record<string, any> {
        return { ...options, workspace: this.workspaceName };
    }

    /**
     * List records from the table, applying filters.
     * This corresponds to the `find` methods in pymetasploit3.
     * @param options Filtering options.
     */
    async list(options: TListOptions = {} as TListOptions): Promise<TInfo[]> {
        // The RPC call often uses the plural table name (e.g., db.hosts)
        const rpcMethod = `db.${this.tableNamePlural}`;
        // Check if the method name exists in Methods, otherwise handle potential error
        if (!(rpcMethod in Methods)) {
            console.warn(`RPC method ${rpcMethod} not found in defined methods. Attempting call anyway.`);
            // Or throw: throw new Error(`RPC method ${rpcMethod} not defined.`);
        }
        const res = await this.rpc.call(rpcMethod, [this.addWorkspace(options)]);
        // The result array is usually keyed by the plural table name
        return res[this.tableNamePlural] || [];
    }

    /**
     * Report (add/update) a record to the table.
     * @param attributes Record data.
     */
    async report(attributes: DbAttributeRecord): Promise<any> {
        const rpcMethod = `db.report_${this.tableNameSingular}`;
        if (!(rpcMethod in Methods)) {
             throw new Error(`RPC method ${rpcMethod} not defined.`);
        }
        return this.rpc.call(rpcMethod, [this.addWorkspace(attributes)]);
    }

    /**
     * Delete records matching the attributes.
     * @param attributes Criteria for deletion.
     */
    async delete(attributes: DbAttributeRecord): Promise<any> {
         const rpcMethod = `db.del_${this.tableNameSingular}`;
         if (!(rpcMethod in Methods)) {
             throw new Error(`RPC method ${rpcMethod} not defined.`);
         }
        return this.rpc.call(rpcMethod, [this.addWorkspace(attributes)]);
    }

    /**
     * Get a single record matching the attributes.
     * @param attributes Criteria for retrieval.
     */
    async get(attributes: DbAttributeRecord): Promise<TInfo | null> {
         const rpcMethod = `db.get_${this.tableNameSingular}`;
         if (!(rpcMethod in Methods)) {
             throw new Error(`RPC method ${rpcMethod} not defined.`);
         }
        const res = await this.rpc.call(rpcMethod, [this.addWorkspace(attributes)]);
        // Result object is usually keyed by the singular table name
        return res[this.tableNameSingular] || null;
    }

    // Alias for report, matching python
    update = this.report;
}

// --- Concrete Table Implementations ---

export class HostsTable extends MsfTable<HostInfo, HostListOptions> {
    protected tableNamePlural = 'hosts';
    protected tableNameSingular = 'host';

    // Override report if specific args are needed
    async report(attributes: { host: string } & Partial<Omit<HostInfo, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>): Promise<any> {
        return super.report(attributes);
    }
    // Override delete if specific validation is needed
    async delete(attributes: { host?: string; address?: string; addresses?: string[] }): Promise<any> {
        if (!attributes.host && !attributes.address && !attributes.addresses) {
            throw new Error('Host delete requires host, address, or addresses attribute.');
        }
        return super.delete(attributes);
    }
     // Override get if specific validation is needed
     async get(attributes: { host?: string; address?: string; addr?: string }): Promise<HostInfo | null> {
        if (!attributes.host && !attributes.address && !attributes.addr) {
            throw new Error('Host get requires host, address, or addr attribute.');
        }
        return super.get(attributes);
    }
}

export class ServicesTable extends MsfTable<ServiceInfo, ServiceListOptions> {
    protected tableNamePlural = 'services';
    protected tableNameSingular = 'service';

    async report(attributes: { host: string; port: number; proto: string } & Partial<Omit<ServiceInfo, 'id' | 'host_id' | 'created_at' | 'updated_at'>>): Promise<any> {
        return super.report(attributes);
    }
    async delete(attributes: { host?: string; address?: string; addresses?: string[]; port?: number; proto?: string }): Promise<any> {
        const hasHost = attributes.host || attributes.address || attributes.addresses;
        const hasService = attributes.port !== undefined && attributes.proto;
        if (!hasHost && !hasService) {
            throw new Error('Service delete requires host/address or port/proto pair.');
        }
        return super.delete(attributes);
    }
    async get(attributes: { host?: string; address?: string; addr?: string; port?: number; proto?: string }): Promise<ServiceInfo | null> {
        const hasHost = attributes.host || attributes.address || attributes.addr;
        const hasService = attributes.port !== undefined && attributes.proto;
        if (!hasHost && !hasService) {
            throw new Error('Service get requires host/address or port/proto pair.');
        }
        return super.get(attributes);
    }
}

export class VulnsTable extends MsfTable<VulnInfo, VulnListOptions> {
    protected tableNamePlural = 'vulns';
    protected tableNameSingular = 'vuln';

    async report(attributes: { host: string; name: string } & Partial<Omit<VulnInfo, 'id' | 'host_id' | 'service_id' | 'created_at' | 'updated_at'>>): Promise<any> {
        return super.report(attributes);
    }
     async delete(attributes: { host?: string; address?: string; addresses?: string[] }): Promise<any> {
        if (!attributes.host && !attributes.address && !attributes.addresses) {
            throw new Error('Vuln delete requires host, address, or addresses attribute.');
        }
        return super.delete(attributes);
    }
    async get(attributes: { host?: string; address?: string; addr?: string }): Promise<VulnInfo | null> {
        if (!attributes.host && !attributes.address && !attributes.addr) {
            throw new Error('Vuln get requires host, address, or addr attribute.');
        }
        return super.get(attributes);
    }
}

export class NotesTable extends MsfTable<NoteInfo, NoteListOptions> {
    protected tableNamePlural = 'notes';
    protected tableNameSingular = 'note';

     // `report` in python takes rtype, data first
    async report(attributes: { type: string; data: any } & Partial<Omit<NoteInfo, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>): Promise<any> {
        // Adjust for python's `rtype` parameter name if needed, assuming TS uses `type`
        return super.report(attributes);
    }
    async delete(attributes: Partial<Pick<NoteInfo, 'host_id' | 'service_id' | 'ntype'>> & { host?: string; address?: string; addresses?: string[]; port?: number; proto?: string }): Promise<any> {
        // Basic validation - python version checks for host/addr/addresses OR port/proto OR ntype?
        // Simplified check: Ensure some criteria are provided
        if (Object.keys(attributes).length === 0) {
             throw new Error('Note delete requires some criteria.');
        }
        return super.delete(attributes);
    }
     async get(attributes: { host?: string; address?: string; addr?: string } & Partial<Pick<NoteInfo, 'ntype'>> & { port?: number; proto?: string }): Promise<NoteInfo | null> {
        if (!attributes.host && !attributes.address && !attributes.addr) {
            throw new Error('Note get requires host, address, or addr attribute.');
        }
        return super.get(attributes);
    }
}

export class LootsTable extends MsfTable<LootInfo, LootListOptions> {
    protected tableNamePlural = 'loots';
    protected tableNameSingular = 'loot';

    // `report` in python takes path, rtype first
    async report(attributes: { path: string; type: string } & Partial<Omit<LootInfo, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'ltype'>>): Promise<any> {
        // Map `type` to `ltype` if needed by RPC, assuming TS uses `type`
        const rpcAttrs = { ...attributes, ltype: attributes.type };
        if ('type' in rpcAttrs) {
           delete (rpcAttrs as any).type; // Need cast to any if TS still complains based on initial type
        }
        return super.report(rpcAttrs);
    }
    // No specific delete/get methods in python version beyond base MsfTable
}

export class CredsTable extends MsfTable<CredInfo, CredListOptions> {
    protected tableNamePlural = 'creds';
    protected tableNameSingular = 'cred';

    // Python notes no db.report_cred or db.get_cred, only list/find
    // Override report/get/delete to throw error?
    async report(attributes: DbAttributeRecord): Promise<any> {
        // return super.report(attributes); // Assuming db.report_cred might exist now?
        throw new Error('db.report_cred is not available via standard RPC (check Metasploit version).');
    }
     async delete(attributes: DbAttributeRecord): Promise<any> {
        throw new Error('db.del_cred is not available via standard RPC (check Metasploit version).');
     }
     async get(attributes: DbAttributeRecord): Promise<CredInfo | null> {
        throw new Error('db.get_cred is not available via standard RPC (check Metasploit version).');
     }
}

export class EventsTable extends MsfTable<EventInfo, EventListOptions> {
    protected tableNamePlural = 'events';
    protected tableNameSingular = 'event';

     async report(attributes: { username?: string; host?: string; name: string } & Partial<Omit<EventInfo, 'id' | 'workspace_id' | 'created_at'>>): Promise<any> {
        if (!attributes.username && !attributes.host) {
             throw new Error('Event report requires username or host attribute.');
        }
        return super.report(attributes);
    }
    // No specific delete/get methods in python version beyond base MsfTable
}

export class ClientsTable extends MsfTable<ClientInfo, ClientListOptions> {
    protected tableNamePlural = 'clients';
    protected tableNameSingular = 'client';

     async report(attributes: { ua_string: string; host: string } & Partial<Omit<ClientInfo, 'id' | 'host_id' | 'created_at' | 'updated_at'>>): Promise<any> {
        return super.report(attributes);
    }
    async delete(attributes: { host?: string; address?: string; addresses?: string[] }): Promise<any> {
        if (!attributes.host && !attributes.address && !attributes.addresses) {
            throw new Error('Client delete requires host, address, or addresses attribute.');
        }
        return super.delete(attributes);
    }
    async get(attributes: { host?: string; address?: string; addr?: string; ua_string?: string }): Promise<ClientInfo | null> {
         if (!attributes.host && !attributes.address && !attributes.addr) {
             throw new Error('Client get requires host, address, or addr attribute.');
         }
        // Python version required host OR ua_string - check if RPC allows this?
        if (!attributes.ua_string) {
            console.warn('Client get typically requires ua_string as well.');
        }
        return super.get(attributes);
    }
} 