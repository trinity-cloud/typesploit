import { RpcClient } from './rpc';
import * as Methods  from './methods';
import { SessionInfo } from './types';
import { MsfTimeoutError } from './errors'; // Import timeout error

/** Delay function */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Represents a generic Metasploit Session.
 */
export class MsfSession {
    constructor(
        protected rpc: RpcClient,
        public readonly id: number, // Session ID is numeric
        public readonly info: SessionInfo
    ) {}

    /**
     * Get the session ID.
     */
    get sid(): number {
        return this.id;
    }

    /**
     * Get the session type (e.g., 'meterpreter', 'shell').
     */
    get type(): string {
        return this.info.type;
    }

     /**
     * Get the session UUID.
     */
    get uuid(): string {
        return this.info.uuid;
    }

    /**
     * Stop the session.
     */
    async stop(): Promise<any> {
        return this.rpc.call(Methods.SessionStop, [this.id]);
    }

    /**
     * Get modules compatible with this session.
     */
    async compatibleModules(): Promise<string[]> {
        const res = await this.rpc.call(Methods.SessionCompatibleModules, [this.id]);
        return res.modules || [];
    }

    // Placeholder for read - to be implemented by subclasses
    async read(): Promise<any> {
        throw new Error('Read method must be implemented by subclass (Meterpreter/Shell).');
    }

    // Placeholder for write - to be implemented by subclasses
    async write(data: string): Promise<any> {
        throw new Error('Write method must be implemented by subclass (Meterpreter/Shell).');
    }

    /**
     * Helper method to run a command and gather output until specific strings are found or timeout.
     * Needs to be implemented by subclasses using their specific read/write methods.
     */
    async runCommandWithOutput(
        command: string, 
        endPrompts: string[], 
        timeoutMs: number,
        readMethod: () => Promise<any>, // Function to call for reading output
        writeMethod: (cmd: string) => Promise<any> // Function to call for writing command
    ): Promise<string> {
        await writeMethod(command);
        let fullOutput = '';
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const output = await readMethod();
                // Assuming output structure has a 'data' field
                const newData = output && output.data ? output.data : ''; 
                if (newData) {
                    fullOutput += newData;
                    // Check if any end prompt is met
                    if (endPrompts.some(prompt => fullOutput.includes(prompt))) {
                        return fullOutput;
                    }
                }
                // Add a small delay if no new data or prompt not met yet
                await delay(200);
            } catch (error) {
                // Handle potential errors during read, e.g., session closed
                throw new Error(`Error reading from session ${this.id} during runCommandWithOutput: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        throw new MsfTimeoutError(`Timeout (${timeoutMs}ms) waiting for prompts [${endPrompts.join(', ')}] after running command: ${command}`);
    }
}

/**
 * Represents a standard Shell Session.
 */
export class ShellSession extends MsfSession {
    constructor(rpc: RpcClient, id: number, info: SessionInfo) {
        super(rpc, id, info);
        if (info.type !== 'shell') {
            throw new Error(`Session ${id} is type '${info.type}', not 'shell'.`);
        }
    }

    /**
     * Read data from the shell.
     * @param timeout Optional timeout in seconds.
     */
    async read(timeout?: number): Promise<any> {
        // Note: The python version had a default timeout implemented in the client.
        // Here we just pass the args. The raw RPC call might not support timeout directly.
        const args = timeout === undefined ? [this.id] : [this.id, timeout]; // Check if RPC supports timeout arg
        return this.rpc.call(Methods.SessionShellRead, args);
    }

    /**
     * Write data (command) to the shell.
     * @param data The command/data to write.
     */
    async write(data: string): Promise<any> {
        // Ensure newline like python version?
        const command = data.endsWith('\n') ? data : data + '\n';
        return this.rpc.call(Methods.SessionShellWrite, [this.id, command]);
    }

    /**
     * Attempt to upgrade the shell session to a Meterpreter session.
     * @param lhost Listener host for the upgrade payload.
     * @param lport Listener port for the upgrade payload.
     */
    async upgrade(lhost: string, lport: number): Promise<any> {
        return this.rpc.call(Methods.SessionShellUpgrade, [this.id, lhost, lport]);
    }

    /**
     * Run a shell command and wait for specific output or timeout.
     * @param command The command to execute.
     * @param endPrompts An array of strings to look for in the output to signal command completion.
     * @param timeoutMs Timeout in milliseconds (default: 30000ms).
     */
    async runWithOutput(command: string, endPrompts: string[], timeoutMs: number = 30000): Promise<string> {
        return this.runCommandWithOutput(
            command, 
            endPrompts, 
            timeoutMs, 
            () => this.read(), // Pass the ShellSession read method
            (cmd) => this.write(cmd) // Pass the ShellSession write method
        );
    }
}

/**
 * Interacts with a Meterpreter session's ring buffer.
 */
export class SessionRing {
    constructor(private rpc: RpcClient, private sessionId: number) {}

    /**
     * Read data from the ring buffer.
     * @param readPointer Optional read pointer offset.
     */
    async read(readPointer?: number): Promise<any> {
        const args = readPointer === undefined ? [this.sessionId] : [this.sessionId, readPointer];
        return this.rpc.call(Methods.SessionRingRead, args);
    }

    /**
     * Write data to the ring buffer.
     * @param data The data string to write.
     */
    async put(data: string): Promise<any> {
        return this.rpc.call(Methods.SessionRingPut, [this.sessionId, data]);
    }

    /**
     * Get the last sequence number from the ring buffer.
     */
    async last(): Promise<number> {
        const res = await this.rpc.call(Methods.SessionRingLast, [this.sessionId]);
        return res.seq; // Assuming the response structure { seq: number }
    }

    /**
     * Clear the ring buffer.
     */
    async clear(): Promise<any> {
        return this.rpc.call(Methods.SessionRingClear, [this.sessionId]);
    }
}

/**
 * Represents a Meterpreter Session.
 */
export class MeterpreterSession extends MsfSession {
    public readonly ring: SessionRing;

    constructor(rpc: RpcClient, id: number, info: SessionInfo) {
        super(rpc, id, info);
        if (info.type !== 'meterpreter') {
            throw new Error(`Session ${id} is type '${info.type}', not 'meterpreter'.`);
        }
        this.ring = new SessionRing(rpc, id);
    }

    /**
     * Read data from the interactive meterpreter channel.
     */
    async read(): Promise<any> {
        return this.rpc.call(Methods.SessionMeterpreterRead, [this.id]);
    }

    /**
     * Write data to the interactive meterpreter channel.
     * @param data The command/data to write.
     */
    async write(data: string): Promise<any> {
        return this.rpc.call(Methods.SessionMeterpreterWrite, [this.id, data]);
    }

    /**
     * Detach the meterpreter session (background it).
     */
  async detach(): Promise<any> {
        return this.rpc.call(Methods.SessionMeterpreterSessionDetach, [this.id]);
  }

    /**
     * Kill the meterpreter session.
     */
  async kill(): Promise<any> {
        return this.rpc.call(Methods.SessionMeterpreterSessionKill, [this.id]);
    }

    /**
     * Simulate tab completion in the meterpreter session.
     * @param line The line buffer to perform tab completion on.
     */
    async tabs(line: string): Promise<string[]> {
        const res = await this.rpc.call(Methods.SessionMeterpreterTabs, [this.id, line]);
        return res.tabs || [];
    }

    /**
     * Run a single meterpreter command.
     * @param command The command to run.
     */
    async runSingle(command: string): Promise<any> {
        return this.rpc.call(Methods.SessionMeterpreterRunSingle, [this.id, command]);
    }

    /**
     * Run a meterpreter script.
     * @param scriptName The name of the script to run.
     */
    async runScript(scriptName: string): Promise<any> {
        return this.rpc.call(Methods.SessionMeterpreterScript, [this.id, scriptName]);
    }

    /**
     * Get the directory separator for the target system.
     */
    async getDirectorySeparator(): Promise<string> {
        const res = await this.rpc.call(Methods.SessionMeterpreterDirectorySeparator, [this.id]);
        return res.separator;
    }

    /**
     * Run a meterpreter command and wait for specific output or timeout.
     * Note: Meterpreter might not always return predictable prompts.
     * Using runSingle might be more appropriate for simple commands.
     * This reads from the *interactive* channel, not the ring buffer.
     * @param command The command to execute.
     * @param endPrompts An array of strings to look for in the output to signal command completion.
     * @param timeoutMs Timeout in milliseconds (default: 30000ms).
     */
    async runWithOutput(command: string, endPrompts: string[], timeoutMs: number = 30000): Promise<string> {
        return this.runCommandWithOutput(
            command, 
            endPrompts, 
            timeoutMs, 
            () => this.read(), // Pass the MeterpreterSession read method
            (cmd) => this.write(cmd) // Pass the MeterpreterSession write method
        );
  }
}