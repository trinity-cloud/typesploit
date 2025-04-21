/**
 * Type declarations for modules without built-in TypeScript types.
 */
/* REMOVED node-fetch shim as official @types/node-fetch seem to be installed
declare module 'node-fetch' {
  const fetch: any;
  export default fetch;
}
*/

// @msgpack/msgpack shim
declare module '@msgpack/msgpack' {
  /**
   * Encode a JavaScript value into MessagePack.
   */
  export function encode(data: any): Uint8Array;
  /**
   * Decode MessagePack data into a JavaScript value.
   */
  export function decode(data: Uint8Array): any;
}

/** Represents a single option for a Metasploit module. */
export interface ModuleOption {
  type: 'string' | 'bool' | 'integer' | 'port' | 'rhost' | 'rhosts' | 'lhost' | 'lport' | 'path' | 'enum' | 'address' | 'bool' | string; // Add more as needed
  required: boolean;
  advanced: boolean;
  evasion: boolean;
  desc: string;
  default?: any;
  enums?: string[];
  // Potentially other fields like 'max', 'min', etc.
}

/** Represents the metadata/information about a Metasploit module. */
export interface ModuleInfo {
  name: string;
  fullname: string;
  rank: number | string; // Sometimes string like "manual"
  description: string;
  license: string;
  filepath: string;
  moduletype: string; // 'exploit', 'payload', 'post', etc.
  references: [string, string][]; // Array of [type, ref_id] like ['CVE', '2021-1234']
  authors: string[];
  targets?: Record<number, string>; // For exploits: { 0: 'Automatic', 1: 'Windows XP SP2' }
  payloads?: string[]; // Compatible payloads for exploits
  arch?: string | string[];
  platform?: string | string[];
  disclosuredate?: string; // e.g., '2023-01-15 09:00:00 -0600'
  default_target?: number;
  default_action?: string; // For auxiliary/post
  actions?: Record<string, string>; // For auxiliary/post
  // Potentially other fields
}

/** Represents the structure for module options keyed by option name. */
export type ModuleOptions = Record<string, ModuleOption>;

/** Represents the data structure for a single session from session.list */
export interface SessionInfo {
    type: 'meterpreter' | 'shell' | string; // Can be other types too
    tunnel_local: string;
    tunnel_peer: string;
    via_exploit: string;
    via_payload: string;
    desc: string;
    info: string;
    workspace: string;
    session_host: string;
    session_port: number;
    target_host: string;
    username: string;
    uuid: string;
    exploit_uuid: string;
    routes: string[]; // Or potentially a more structured type
    arch: string;
    platform?: string; // Older msfrpcd versions might not include this
    advanced_info?: Record<string, any>; // For meterpreter specific info like OS, Arch, etc.
}

// --- Database Types ---

/** Basic structure for DB filter options */
export interface DbListFilterOptions {
    workspace?: string; // Usually handled by context, but sometimes needed
    limit?: number;
    offset?: number;
    addresses?: string[];
    search_term?: string; // Generic search term
}

/** Represents a Host in the database */
export interface HostInfo {
    id: number;
    workspace_id: number;
    address: string;
    mac?: string;
    name?: string;
    state?: 'alive' | 'down' | 'unknown';
    os_name?: string;
    os_flavor?: string;
    os_sp?: string;
    os_lang?: string;
    arch?: string;
    purpose?: string;
    info?: string;
    comments?: string;
    scope?: string;
    virtual_host?: string;
    note_count?: number;
    vuln_count?: number;
    service_count?: number;
    host_detail_count?: number;
    cred_count?: number;
    loot_count?: number;
    created_at: string;
    updated_at: string;
}
export interface HostListOptions extends DbListFilterOptions {
    only_up?: boolean;
}

/** Represents a Service in the database */
export interface ServiceInfo {
    id: number;
    host_id: number;
    port: number;
    proto: 'tcp' | 'udp' | string;
    state: 'open' | 'closed' | 'filtered' | 'unknown';
    name?: string;
    info?: string;
    created_at: string;
    updated_at: string;
}
export interface ServiceListOptions extends DbListFilterOptions {
    ports?: number[];
    proto?: string;
    names?: string[];
    only_up?: boolean; // Refers to host state
}

/** Represents a Vulnerability in the database */
export interface VulnInfo {
    id: number;
    host_id: number;
    service_id?: number;
    name: string;
    info?: string;
    refs?: string[]; // Array of ref names like 'CVE-2021-1234'
    exploited_at?: string;
    created_at: string;
    updated_at: string;
    // Potentially more fields like vuln_detail_count
}
export interface VulnListOptions extends ServiceListOptions {} // Often filtered by host/service criteria

/** Represents a Note in the database */
export interface NoteInfo {
    id: number;
    workspace_id: number;
    host_id?: number;
    service_id?: number;
    ntype: string;
    data: any; // Can be complex object or string
    critical?: boolean;
    seen?: boolean;
    created_at: string;
    updated_at: string;
}
export interface NoteListOptions extends DbListFilterOptions {
    ntype?: string;
    ports?: number[]; // Refers to service port
    proto?: string; // Refers to service proto
}

/** Represents Loot in the database */
export interface LootInfo {
    id: number;
    workspace_id: number;
    host_id?: number;
    service_id?: number;
    ltype: string;
    path: string;
    data?: any; // Actual loot data
    name?: string;
    info?: string;
    module_fullname?: string; // Module that generated the loot
    created_at: string;
    updated_at: string;
}
export interface LootListOptions extends DbListFilterOptions {}

/** Represents Credentials in the database */
export interface CredInfo {
    id: number;
    workspace_id: number;
    host_id?: number;
    service_id?: number;
    origin_type: string; // e.g., 'service', 'session'
    origin_id?: number;
    module_fullname?: string;
    username: string;
    private_type?: string; // e.g., 'password', 'ssh_key'
    private_data?: string;
    realm_key?: string;
    realm_value?: string;
    jtr_format?: string;
    created_at: string;
    updated_at: string;
}
export interface CredListOptions extends DbListFilterOptions {}

/** Represents an Event in the database */
export interface EventInfo {
    id: number;
    workspace_id: number;
    host_id?: number;
    name: string; // e.g., 'module_run', 'workspace_added'
    info?: any;
    username?: string;
    created_at: string;
}
export interface EventListOptions extends DbListFilterOptions {}

/** Represents a Client in the database */
export interface ClientInfo {
    id: number;
    host_id: number;
    ua_string: string;
    ua_name?: string;
    ua_ver?: string;
    arch?: string;
    os_name?: string;
    os_flavor?: string;
    os_sp?: string;
    os_lang?: string;
    created_at: string;
    updated_at: string;
}
export interface ClientListOptions extends DbListFilterOptions {
    ua_name?: string;
    ua_ver?: string;
}

/** Represents a Workspace in the database */
export interface WorkspaceInfo {
    id: number;
    name: string;
    description?: string;
    boundary?: string;
    limit_to_network?: boolean;
    owner_id?: number; // Might not be available via RPC
    created_at: string;
    updated_at: string;
}

// --- Console Types ---

/** Represents information about a console instance */
export interface ConsoleInfo {
    id: string; // Console IDs are strings
    prompt: string;
    busy: boolean;
    encoding?: string; // Optional, might be present
}

/** Represents the response from console.read */
export interface ConsoleReadResponse {
    data: string;
    prompt: string;
    busy: boolean;
}