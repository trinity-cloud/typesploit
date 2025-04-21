import { RpcClient } from './rpc';
import * as Methods from './methods';
import { ModuleInfo, ModuleOption, ModuleOptions } from './types';
import { ValueError } from './errors';
import { decode } from '@msgpack/msgpack';

/**
 * Represents a generic Metasploit module.
 * Provides methods for accessing information, options, and execution.
 */
export class MsfModule {
  protected _info!: ModuleInfo;
  protected _options!: ModuleOptions;
  protected _runOptions: Record<string, any> = {};

  constructor(
    protected rpc: RpcClient,
    public readonly moduleType: string,
    public readonly moduleName: string
  ) {}

  /**
   * Asynchronously initializes the module by fetching its info and options.
   * Must be called after instantiation.
   */
  async init(): Promise<void> {
    [this._info, this._options] = await Promise.all([
      this.rpc.call(Methods.ModuleInfo, [this.moduleType, this.moduleName]),
      this.rpc.call(Methods.ModuleOptions, [this.moduleType, this.moduleName])
    ]);

    // Initialize runOptions with defaults
    for (const key in this._options) {
      const option = this._options[key];
      if (option.default !== undefined && option.default !== null) {
        this._runOptions[key] = option.default;
      }
    }

     // Handle default action for auxiliary/post modules (similar to python)
     if (this.moduleType === 'auxiliary' || this.moduleType === 'post') {
      const defaultAction = this._info.default_action;
      if (defaultAction) {
        const actionKey = 'ACTION';
         // Ensure ACTION option exists in _options if not provided by RPC
         if (!this._options[actionKey] && this._info.actions?.[defaultAction]) {
          this._options[actionKey] = {
            type: 'enum',
            required: true, // Usually required if actions exist
            advanced: false,
            evasion: false,
            desc: 'The action to perform.',
            default: defaultAction,
            enums: Object.keys(this._info.actions)
          };
        }
        // Set default run option
        this._runOptions[actionKey] = defaultAction;
      }
    }
  }

  /**
   * Get the full information about the module.
   * Requires init() to be called first.
   */
  get info(): ModuleInfo {
    if (!this._info) {
      throw new Error('Module not initialized. Call init() first.');
    }
    return this._info;
  }

   /**
   * Get all available option names for the module.
   * Requires init() to be called first.
   */
  get options(): string[] {
    if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return Object.keys(this._options);
  }

  /**
   * Get the names of required options.
   * Requires init() to be called first.
   */
  get required(): string[] {
    if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return this.options.filter(key => this._options[key].required);
  }

  /**
   * Get the names of options that are required but not currently set in runOptions.
   * Requires init() to be called first.
   */
  get missingRequired(): string[] {
     if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return this.required.filter(key => this._runOptions[key] === undefined || this._runOptions[key] === null);
  }

  /**
   * Get the names of advanced options.
   * Requires init() to be called first.
   */
  get advanced(): string[] {
    if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return this.options.filter(key => this._options[key].advanced);
  }

   /**
   * Get the names of evasion options.
   * Requires init() to be called first.
   */
  get evasion(): string[] {
     if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    return this.options.filter(key => this._options[key].evasion);
  }

  /**
   * Get the currently configured options for running the module.
   */
  get runOptions(): Record<string, any> {
    return { ...this._runOptions }; // Return a copy
  }

  /**
   * Get detailed information about a specific option.
   * @param optionName The name of the option.
   */
  optionInfo(optionName: string): ModuleOption {
    if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    if (!this._options[optionName]) {
        throw new Error(`Invalid option '${optionName}'.`);
    }
    return this._options[optionName];
  }

  /**
   * Get the current value of a specific run option.
   * @param key The option name.
   */
  getOption(key: string): any {
    if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    // We check _options to ensure it's a valid option name for this module
    if (!this._options[key]) {
        throw new Error(`Invalid option '${key}'.`);
    }
    return this._runOptions[key];
  }

  /**
   * Set the value for a specific run option.
   * Performs basic type checking based on option metadata.
   * @param key The option name.
   * @param value The value to set.
   */
  setOption(key: string, value: any): void {
     if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    const optionMeta = this._options[key];
    if (!optionMeta) {
      throw new Error(`Invalid option '${key}'.`);
    }

    // Basic type validation (can be expanded)
    if (optionMeta.type === 'bool' && typeof value !== 'boolean') {
      throw new TypeError(`Option '${key}' expects a boolean, received ${typeof value}`);
    }
    if ((optionMeta.type === 'integer' || optionMeta.type === 'port' || optionMeta.type === 'lport' ) && typeof value !== 'number') {
         // Allow string representation of numbers for convenience, attempt conversion
         if (typeof value === 'string' && !isNaN(parseInt(value, 10))) {
            value = parseInt(value, 10);
         } else {
            throw new TypeError(`Option '${key}' expects a number, received ${typeof value}`);
         }
    }
     if (optionMeta.enums && !optionMeta.enums.includes(value)) {
       throw new ValueError(`Value '${value}' for option '${key}' is not one of the allowed enums: ${optionMeta.enums.join(', ')}`);
     }

    this._runOptions[key] = value;
  }

   /**
   * Update multiple run options at once.
   * @param optionsToUpdate A record of option names and their new values.
   */
  updateOptions(optionsToUpdate: Record<string, any>): void {
     if (!this._options) {
        throw new Error('Module not initialized. Call init() first.');
    }
    for (const key in optionsToUpdate) {
        // Use setOption to leverage validation
        this.setOption(key, optionsToUpdate[key]);
    }
  }

  /**
   * Execute the module with the current run options.
   * Handles payload integration for exploit modules (to be overridden in subclass).
   * @param extraOptions Additional options specific to this execution (e.g., payload).
   */
  async execute(extraOptions: Record<string, any> = {}): Promise<any> {
    if (this.missingRequired.length > 0) {
      throw new Error(`Module missing required options: ${this.missingRequired.join(', ')}`);
    }
    // Combine runOptions with any temporary execution options
    const finalOptions = { ...this._runOptions, ...extraOptions };
    return this.rpc.call(Methods.ModuleExecute, [this.moduleType, this.moduleName, finalOptions]);
  }

   /**
   * Run the module's check method, if available.
   * @param extraOptions Additional options specific to this execution.
   */
   async check(extraOptions: Record<string, any> = {}): Promise<any> {
     if (this.missingRequired.length > 0) {
       console.warn(`Module check called with missing required options: ${this.missingRequired.join(', ')}`);
     }
    const finalOptions = { ...this._runOptions, ...extraOptions };
    return this.rpc.call(Methods.ModuleCheck, [this.moduleType, this.moduleName, finalOptions]);
   }
}

/**
 * Represents a Metasploit Exploit module.
 */
export class ExploitModule extends MsfModule {
  constructor(rpc: RpcClient, moduleName: string) {
    super(rpc, 'exploit', moduleName);
  }

  // Override init to set the TARGET option
  async init(): Promise<void> {
    await super.init();
    
    // Ensure TARGET is in _options, add it if needed
    if (!this._options['TARGET']) {
      this._options['TARGET'] = {
        type: 'integer',
        required: false,
        advanced: false,
        evasion: false,
        desc: 'Target index.',
        default: this._info.default_target || 0
      };
    }
    
    // Initialize the TARGET option in runOptions
    this._runOptions['TARGET'] = this.target;
  }

  /**
   * Get the list of compatible payload names for this exploit.
   * Requires init() to be called first.
   */
  get payloads(): string[] {
    return this.info.payloads || [];
  }

  /**
   * Get the currently selected target ID.
   * Defaults to the module's default_target or 0.
   */
  get target(): number {
    // Use the explicit TARGET runOption if set, otherwise default from info
    return this._runOptions['TARGET'] !== undefined 
      ? this._runOptions['TARGET'] 
      : (this._info?.default_target ?? 0);
  }

  /**
   * Set the target ID for the exploit.
   * @param targetId The target ID number.
   */
  set target(targetId: number) {
    if (this._info?.targets && this._info.targets[targetId] === undefined) {
        console.warn(`Target ID ${targetId} may not be valid for module ${this.moduleName}`);
        // Decide if we should throw an error or just warn
        // throw new Error(`Target ID ${targetId} is not valid for module ${this.moduleName}`);
    }
    this._runOptions['TARGET'] = targetId;
  }

  /**
   * Get compatible payloads for the currently selected target.
   */
  async targetPayloads(): Promise<string[]> {
    const res = await this.rpc.call(Methods.ModuleTargetCompatiblePayloads, [
        this.moduleName,
        this.target
    ]);
    return res.payloads || [];
  }

  // TODO: Add Evasion Payloads methods if needed

  /**
   * Execute the exploit module.
   * Handles setting the PAYLOAD option and merging payload options.
   * @param payload Optional: The payload to use (either name as string or PayloadModule instance).
   * @param extraOptions Additional options specific to this execution.
   */
  async execute(extraOptions: Record<string, any> = {}): Promise<any> {
    // Extract payload from extraOptions if provided
    const payload: string | PayloadModule | undefined = extraOptions.payload;
    // Remove payload from extraOptions so it doesn't get passed directly as a run option
    const { payload: _, ...remainingExtraOptions } = extraOptions;

    if (this.missingRequired.length > 0) {
        throw new Error(`Module missing required options: ${this.missingRequired.join(', ')}`);
    }

    const finalOptions = { ...this.runOptions, ...remainingExtraOptions }; // Use remainingExtraOptions
    
    // Always ensure TARGET is set
    finalOptions['TARGET'] = this.target;

    if (payload) {
        let payloadName: string;
        let payloadRunOptions: Record<string, any> = {};

        if (typeof payload === 'string') {
            payloadName = payload;
        } else if (payload instanceof PayloadModule) {
            payloadName = payload.moduleName;
            payloadRunOptions = payload.runOptions;
            // Ensure payload is initialized if it's an object
            if (!payload.info) {
                await payload.init();
            }
        } else {
             throw new TypeError("Payload must be a string (name) or PayloadModule instance.");
        }

        // Check compatibility (optional, relies on info being accurate)
        const compatiblePayloads = this.info.payloads || await this.targetPayloads();
        if (!compatiblePayloads.includes(payloadName)) {
             console.warn(`Payload ${payloadName} might not be compatible with exploit ${this.moduleName} and target ${this.target}.`);
             // Optionally throw an error here
             // throw new ValueError(`Invalid payload (${payloadName}) for exploit ${this.moduleName} target ${this.target}.`);
        }

        finalOptions['PAYLOAD'] = payloadName;

        // Merge payload options, respecting existing exploit options
        for (const key in payloadRunOptions) {
             if (payloadRunOptions[key] !== undefined && payloadRunOptions[key] !== null && finalOptions[key] === undefined) {
                finalOptions[key] = payloadRunOptions[key];
             }
        }
         finalOptions['DisablePayloadHandler'] = false; // Ensure handler is enabled if payload is set

    } else {
         finalOptions['DisablePayloadHandler'] = true; // Disable handler if no payload specified
    }

    // Call the base class execute or directly call RPC with potentially modified finalOptions
    // Since the base execute doesn't know about payloads, we call rpc.call directly here
    // Or, we could call super.execute(finalOptions) if base execute just passes options through.
    // Let's call rpc.call directly to ensure payload logic is self-contained here.
    return this.rpc.call(Methods.ModuleExecute, [this.moduleType, this.moduleName, finalOptions]);
  }

   /**
   * Run the exploit's check method.
   * Includes TARGET in the options.
   * @param extraOptions Additional options specific to this execution.
   */
    async check(extraOptions: Record<string, any> = {}): Promise<any> {
        if (this.missingRequired.length > 0) {
          console.warn(`Module check called with missing required options: ${this.missingRequired.join(', ')}`);
        }
        const finalOptions = { ...this.runOptions, ...extraOptions };
        
        // Always ensure TARGET is set correctly
        finalOptions['TARGET'] = this.target;
        
        return this.rpc.call(Methods.ModuleCheck, [this.moduleType, this.moduleName, finalOptions]);
    }
}

// Define PayloadModule before it's used in ExploitModule execute method signature
export class PayloadModule extends MsfModule {
    constructor(rpc: RpcClient, moduleName: string) {
        super(rpc, 'payload', moduleName);
    }

    /**
     * Generate the payload.
     * Note: This might require handling raw binary data correctly.
     * @returns The generated payload (format might vary).
     */
     async generate(): Promise<any> {
        if (this.missingRequired.length > 0) {
          throw new Error(`Payload module missing required options: ${this.missingRequired.join(', ')}`);
        }
        // Execute the module and get the raw msgpack response containing the payload
        const rawResponse: ArrayBuffer = await this.rpc.call(
            Methods.ModuleExecute, 
            [this.moduleType, this.moduleName, this.runOptions], 
            true // Request raw response
        );

        try {
            // Decode the outer msgpack layer
            const decodedResponse = decode(new Uint8Array(rawResponse)) as any;

            if (decodedResponse && decodedResponse.payload !== undefined) {
                // The 'payload' field often contains the actual payload bytes
                // It might already be a Uint8Array or Buffer if msgpack decoded it
                // or potentially a base64 string in some msfrpcd versions/configs?
                // For now, return it directly. Further processing might be needed by the caller.
                 return decodedResponse.payload;
            } else {
                 throw new Error('Payload key not found in the decoded response.');
            }
        } catch (e) {
            throw new Error(`Failed to decode payload response: ${e instanceof Error ? e.message : String(e)}`);
        }
     }
}

/**
 * Represents a Metasploit Auxiliary module.
 */
export class AuxiliaryModule extends MsfModule {
    constructor(rpc: RpcClient, moduleName: string) {
        super(rpc, 'auxiliary', moduleName);
    }

    /** Get the current action set for the module. */
    get action(): string | undefined {
        try {
            // Check if ACTION option exists before trying to access it
            if (this._options && this._options['ACTION']) {
                return this.getOption('ACTION');
            }
            return undefined;
        } catch (e) {
            return undefined;
        }
    }

    /** Set the action for the module. */
    set action(actionName: string | undefined) {
        if (actionName === undefined) {
            // Unsetting might not be directly supported via options?
            // Check if deleting the key works or if setting to default is needed
            console.warn("Unsetting ACTION might require specific handling.");
            return; // Or delete this._runOptions['ACTION'];
        }
        const availableActions = this.info.actions ? Object.keys(this.info.actions) : [];
        if (availableActions.length > 0 && !availableActions.includes(actionName)) {
            throw new ValueError(`Action '${actionName}' is not valid for module ${this.moduleName}. Available: ${availableActions.join(', ')}`);
        }
        this.setOption('ACTION', actionName);
    }
}

/**
 * Represents a Metasploit Post-Exploitation module.
 */
export class PostModule extends MsfModule {
    constructor(rpc: RpcClient, moduleName: string) {
        super(rpc, 'post', moduleName);
    }

     /** Get the current action set for the module. */
     get action(): string | undefined {
        try {
            // Check if ACTION option exists before trying to access it
            if (this._options && this._options['ACTION']) {
                return this.getOption('ACTION');
            }
            return undefined;
        } catch (e) {
            return undefined;
        }
    }

    /** Set the action for the module. */
    set action(actionName: string | undefined) {
        if (actionName === undefined) {
            console.warn("Unsetting ACTION might require specific handling.");
            return;
        }
        const availableActions = this.info.actions ? Object.keys(this.info.actions) : [];
        if (availableActions.length > 0 && !availableActions.includes(actionName)) {
            throw new ValueError(`Action '${actionName}' is not valid for module ${this.moduleName}. Available: ${availableActions.join(', ')}`);
        }
        this.setOption('ACTION', actionName);
    }

    // Post modules often require a SESSION option
    // Consider adding specific handling or validation for SESSION
}

/**
 * Represents a Metasploit Encoder module.
 */
export class EncoderModule extends MsfModule {
    constructor(rpc: RpcClient, moduleName: string) {
        super(rpc, 'encoder', moduleName);
    }

    // TODO: Add encoder-specific methods if needed, e.g., encode
}

/**
 * Represents a Metasploit Nop module.
 */
export class NopModule extends MsfModule {
    constructor(rpc: RpcClient, moduleName: string) {
        super(rpc, 'nop', moduleName);
    }

    // NOP modules usually don't have options or execute methods relevant here
}

// Define ValueError if it's not globally available
// class ValueError extends Error {
//   constructor(message?: string) {
//     super(message);
//     this.name = 'ValueError';
//   }
// } 
