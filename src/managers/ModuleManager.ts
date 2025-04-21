// typesploit/src/managers/ModuleManager.ts

import { RpcClient } from '../rpc';
import * as Methods from '../methods';
import { 
    MsfModule, ExploitModule, PayloadModule, AuxiliaryModule, 
    PostModule, EncoderModule, NopModule 
} from '../module'; // Import the new module classes

/**
 * Manager for Metasploit modules (exploits, payloads, auxiliaries, etc.).
 */
export class ModuleManager {
constructor(private rpc: RpcClient) {}

/** List available exploit module paths. */
async exploits(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleExploits);
  return res.modules;
}

/** List available auxiliary module paths. */
async auxiliary(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleAuxiliary);
  return res.modules;
}

/** List available payload module paths. */
async payloads(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModulePayloads);
  return res.modules;
}

/** List available evasion modules. */
async evasion(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleEvasion);
  return res.modules;
}

/** List available encoder modules. */
async encoders(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleEncoders);
  return res.modules;
}

/** List available nop modules. */
async nops(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleNops);
  return res.modules;
}

/** List supported module platforms. */
async platforms(): Promise<string[]> {
  return this.rpc.call(Methods.ModulePlatforms);
}

/** List available post modules. */
async post(): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModulePost);
  return res.modules;
}

/** Get module metadata. */
async info(type: string, name: string): Promise<any> {
  return this.rpc.call(Methods.ModuleInfo, [type, name]);
}

/** Get module detailed HTML info. */
async infoHtml(type: string, name: string): Promise<any> {
  return this.rpc.call(Methods.ModuleInfoHTML, [type, name]);
}

/** Get module options (raw). */
async options(type: string, name: string): Promise<any> {
  const res = await this.rpc.call(Methods.ModuleOptions, [type, name]);
  return res.options;
}

/** Execute a module with run options. */
async execute(type: string, name: string, runoptions: Record<string, any>): Promise<any> {
  return this.rpc.call(Methods.ModuleExecute, [type, name, runoptions]);
}

/** Search modules by keyword. */
async search(keyword: string): Promise<any> {
  return this.rpc.call(Methods.ModuleSearch, [keyword]);
}

/** Run a module check. */
async check(type: string, name: string, runoptions: Record<string, any>): Promise<any> {
  return this.rpc.call(Methods.ModuleCheck, [type, name, runoptions]);
}

/** Retrieve the raw results of a module run by its UUID. */
async results(uuid: string): Promise<any> {
  return this.rpc.call(Methods.ModuleResults, [uuid]);
}

/** Get stats for modules currently executing. */
async runningStats(): Promise<any> {
  return this.rpc.call(Methods.ModuleRunningStats);
}

/** Get encoding formats for modules. */
async encodeFormats(): Promise<any> {
  return this.rpc.call(Methods.ModuleEncodeFormats);
}

/** Encode using a module. */
async encode(type: string, name: string, options: Record<string, any>): Promise<any> {
  return this.rpc.call(Methods.ModuleEncode, [type, name, options]);
}

/** List sessions compatible with a module. */
async compatibleSessions(name: string): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleCompatibleSessions, [name]);
  return res.modules;
}

/** List payloads compatible with a module type. */
async compatiblePayloads(type: string, name: string): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleCompatiblePayloads, [type, name]);
  return res.payloads;
}

/** List payloads compatible with a specific target. */
async targetCompatiblePayloads(type: string, name: string, target: number): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleTargetCompatiblePayloads, [type, name, target]);
  return res.payloads;
}

/** List evasion payloads compatible with a module. */
async compatibleEvasionPayloads(type: string, name: string): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleCompatibleEvasionPayloads, [type, name]);
  return res.payloads;
}

/** List evasion payloads compatible with a specific target. */
async targetCompatibleEvasionPayloads(type: string, name: string, target: number): Promise<string[]> {
  const res = await this.rpc.call(Methods.ModuleTargetCompatibleEvasionPayloads, [type, name, target]);
  return res.payloads;
}

/**
 * Get an initialized module object.
 * This fetches the module's info and options.
 * @param type The type of module (e.g., 'exploit', 'payload').
 * @param name The full name of the module (e.g., 'windows/smb/ms17_010_eternalblue').
 * @returns A Promise resolving to an initialized module instance (e.g., ExploitModule).
 */
async use(type: 'exploit', name: string): Promise<ExploitModule>;
async use(type: 'payload', name: string): Promise<PayloadModule>;
async use(type: 'auxiliary', name: string): Promise<AuxiliaryModule>;
async use(type: 'post', name: string): Promise<PostModule>;
async use(type: 'encoder', name: string): Promise<EncoderModule>;
async use(type: 'nop', name: string): Promise<NopModule>;
async use(type: string, name: string): Promise<MsfModule>; // Fallback for generic/unknown types
async use(type: string, name: string): Promise<MsfModule> {
    let moduleInstance: MsfModule;

    switch (type) {
        case 'exploit':
            moduleInstance = new ExploitModule(this.rpc, name);
            break;
        case 'payload':
            moduleInstance = new PayloadModule(this.rpc, name);
            break;
        case 'auxiliary':
            moduleInstance = new AuxiliaryModule(this.rpc, name);
            break;
        case 'post':
            moduleInstance = new PostModule(this.rpc, name);
            break;
        case 'encoder':
            moduleInstance = new EncoderModule(this.rpc, name);
            break;
        case 'nop':
            moduleInstance = new NopModule(this.rpc, name);
            break;
        default:
            console.warn(`Unknown module type '${type}'. Returning generic MsfModule instance.`);
            moduleInstance = new MsfModule(this.rpc, type, name);
            break;
    }

    await moduleInstance.init(); // Initialize the module (fetch info/options)
    return moduleInstance;
}
}