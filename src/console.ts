import { RpcClient } from './rpc';
import * as Methods from './methods';
import { ConsoleInfo, ConsoleReadResponse } from './types';
import { MsfModule } from './module'; // For runModuleWithOutput
import { PayloadModule } from './module'; // For runModuleWithOutput

/**
 * Represents an interactive Metasploit Console.
 */
export class MsfConsole {
    public busy: boolean = false;
    public prompt: string = '';

    constructor(private rpc: RpcClient, public readonly id: string) {}

    /**
     * Initialize console state by reading once.
     * Should be called after creation.
     */
    async init(): Promise<void> {
        try {
            const initialState = await this.read();
            this.busy = initialState.busy;
            this.prompt = initialState.prompt;
        } catch (error) {
            console.error(`Failed to initialize console ${this.id}:`, error);
            // Mark as potentially unusable or re-throw?
        }
    }

    /**
     * Read available output from the console.
     * @returns An object containing data, prompt, and busy status.
     */
    async read(): Promise<ConsoleReadResponse> {
        const res: ConsoleReadResponse = await this.rpc.call(Methods.ConsoleRead, [this.id]);
        this.busy = res.busy;
        this.prompt = res.prompt;
        return res;
    }

    /**
     * Write a command to the console.
     * @param command The command string to execute.
     * @returns The write result (usually { written: byte_count }).
     */
    async write(command: string): Promise<any> {
        // Ensure command ends with newline for execution
        const cmd = command.endsWith('\n') ? command : command + '\n';
        this.busy = true; // Assume console becomes busy after writing
        return this.rpc.call(Methods.ConsoleWrite, [this.id, cmd]);
    }

    /**
     * Check if the console is currently busy executing a command.
     * Refreshes state by calling read().
     */
    async isBusy(): Promise<boolean> {
        await this.read(); // Read updates the internal busy state
        return this.busy;
    }

    /**
     * Request tab completion for a given line.
     * @param line The line to get completions for.
     * @returns An array of possible completions.
     */
    async tabs(line: string): Promise<string[]> {
        const res = await this.rpc.call(Methods.ConsoleTabs, [this.id, line]);
        return res.tabs || [];
    }

    /**
     * Detach the session associated with this console (if any).
     */
    async sessionDetach(): Promise<any> {
        return this.rpc.call(Methods.ConsoleSessionDetach, [this.id]);
    }

    /**
     * Kill the session associated with this console (if any).
     */
    async sessionKill(): Promise<any> {
        return this.rpc.call(Methods.ConsoleSessionKill, [this.id]);
    }

    /**
     * Destroy this console instance on the server.
     */
    async destroy(): Promise<any> {
        return this.rpc.call(Methods.ConsoleDestroy, [this.id]);
    }

    /**
     * Helper function to run a command and wait for the prompt.
     * @param command The command to run.
     * @param timeoutMs Max time to wait for prompt in milliseconds.
     * @returns All output read until the prompt appeared.
     */
    async runCommandAndWait(command: string, timeoutMs: number = 30000): Promise<string> {
        await this.write(command);
        let fullOutput = '';
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const output = await this.read();
            fullOutput += output.data;
            if (!output.busy) {
                return fullOutput;
            }
            // Small delay to avoid busy-waiting and hammering the RPC server
            await new Promise(resolve => setTimeout(resolve, 200)); 
        }
        throw new Error(`Timeout waiting for prompt after running command: ${command}`);
    }

    /**
     * Run a module using the console and wait for completion (simplified version).
     * Note: This is less reliable than using module.execute directly, especially for jobs.
     * @param module The module object to run.
     * @param payload Optional payload object.
     * @param runAsJob Whether to run the module as a background job ('-j').
     * @param timeoutMs Timeout for waiting for the command prompt.
     */
    async runModuleWithOutput(
        module: MsfModule,
        payload?: PayloadModule | string,
        runAsJob: boolean = false,
        timeoutMs: number = 300000 // 5 minutes default?
    ): Promise<string> {
        let cmd = `use ${module.moduleName}\n`;
        
        // Set options
        const runOpts = module.runOptions;
        for (const opt in runOpts) {
             if (runOpts[opt] !== undefined && runOpts[opt] !== null) {
                 cmd += `set ${opt} ${runOpts[opt]}\n`;
             }
        }
        
        // Set payload options if provided
        if (payload) {
            let payloadName: string;
            let payloadOpts: Record<string, any> = {};
            if (typeof payload === 'string') {
                payloadName = payload;
                // Cannot get options if only name is provided
            } else {
                payloadName = payload.moduleName;
                payloadOpts = payload.runOptions;
            }
            cmd += `set PAYLOAD ${payloadName}\n`;
             for (const popt in payloadOpts) {
                if (payloadOpts[popt] !== undefined && payloadOpts[popt] !== null) {
                    cmd += `set ${popt} ${payloadOpts[popt]}\n`;
                }
             }
        }

        cmd += runAsJob ? 'exploit -j\n' : 'exploit\n';

        return this.runCommandAndWait(cmd, timeoutMs);
    }
}