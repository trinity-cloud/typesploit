import { RpcClient } from '../rpc';
import * as Methods from '../methods';
import { SessionInfo } from '../types'; // Import SessionInfo type
import { MsfSession, MeterpreterSession, ShellSession } from '../session'; // Import session classes

/**
 * Manager for Metasploit sessions (meterpreter & shell).
 */
export class SessionManager {
  private activeSessions: Record<number, MsfSession> = {}; // Cache for session objects

  constructor(private rpc: RpcClient) {}

  /**
   * List active sessions, returning cached objects or creating new ones.
   * @returns A Record mapping session ID (number) to MsfSession objects.
   */
  async list(): Promise<Record<number, MsfSession>> {
    const rawSessions: Record<string, SessionInfo> = await this.rpc.call(Methods.SessionList);
    const updatedSessions: Record<number, MsfSession> = {};
    const currentIds = new Set<number>();

    for (const sidStr in rawSessions) {
        const sid = parseInt(sidStr, 10);
        if (isNaN(sid)) continue; // Skip if key is not a number
        currentIds.add(sid);
        const sessionInfo = rawSessions[sidStr];

        // Use cached object if available and type matches
        if (this.activeSessions[sid] && this.activeSessions[sid].type === sessionInfo.type) {
            // Optionally update info in cached object if needed
            // this.activeSessions[sid].info = sessionInfo; 
            updatedSessions[sid] = this.activeSessions[sid];
        } else {
            // Create new session object
            try {
                if (sessionInfo.type === 'meterpreter') {
                    updatedSessions[sid] = new MeterpreterSession(this.rpc, sid, sessionInfo);
                } else if (sessionInfo.type === 'shell') {
                    updatedSessions[sid] = new ShellSession(this.rpc, sid, sessionInfo);
                } else {
                    console.warn(`Session ${sid} has unknown type '${sessionInfo.type}'. Using generic MsfSession.`);
                    updatedSessions[sid] = new MsfSession(this.rpc, sid, sessionInfo);
                }
            } catch (error) {
                 console.error(`Failed to create session object for SID ${sid}:`, error);
                 // Optionally create a generic MsfSession as fallback
                 updatedSessions[sid] = new MsfSession(this.rpc, sid, sessionInfo);
            }
        }
    }

     // Remove sessions from cache that are no longer active
     for (const cachedSid in this.activeSessions) {
        if (!currentIds.has(Number(cachedSid))) {
            delete this.activeSessions[cachedSid];
        }
     }

    // Update the cache
    this.activeSessions = { ...this.activeSessions, ...updatedSessions }; 

    return { ...this.activeSessions }; // Return a copy of the current cache
  }

  /**
   * Stop a session by ID.
   * @param sid The numeric session ID.
   */
  async stop(sid: number): Promise<any> {
     // Remove from cache immediately if it exists
     delete this.activeSessions[sid]; 
     return this.rpc.call(Methods.SessionStop, [sid]);
  }

  /**
   * Get a specific session object by its ID.
   * Fetches the latest list if the session is not cached.
   * @param sid The numeric session ID.
   * @returns The specific MsfSession (MeterpreterSession or ShellSession) or undefined if not found.
   */
   async session(sid: number): Promise<MsfSession | undefined> {
     if (this.activeSessions[sid]) {
        return this.activeSessions[sid];
     }
     // If not cached, refresh the list and try again
     await this.list(); 
     return this.activeSessions[sid]; // Return from updated cache
   }

  /**
   * Get a MeterpreterSession object by ID.
   * Throws an error if the session is not found or not a meterpreter session.
   * @param sid The numeric session ID.
   */
   async meterpreter(sid: number): Promise<MeterpreterSession> {
     const session = await this.session(sid);
     if (!session) {
        throw new Error(`Session ${sid} not found.`);
     }
     if (!(session instanceof MeterpreterSession)) {
        throw new Error(`Session ${sid} is type '${session.type}', not Meterpreter.`);
     }
     return session;
   }

  /**
   * Get a ShellSession object by ID.
   * Throws an error if the session is not found or not a shell session.
   * @param sid The numeric session ID.
   */
  async shell(sid: number): Promise<ShellSession> {
      const session = await this.session(sid);
      if (!session) {
         throw new Error(`Session ${sid} not found.`);
      }
      if (!(session instanceof ShellSession)) {
         throw new Error(`Session ${sid} is type '${session.type}', not Shell.`);
      }
      return session;
  }

    // Remove redundant direct methods as they are now on the session objects
    // async readShell(sid: string): Promise<string> { ... }
    // async writeShell(sid: string, data: string): Promise<void> { ... }
    // async readMeterpreter(sid: string): Promise<string> { ... }
    // async writeMeterpreter(sid: string, data: string): Promise<void> { ... }
    // async compatibleModules(sid: string): Promise<string[]> { ... } 
    // async upgradeShell(sid: string): Promise<any> { ... }
    // async meterpreterTabs(sid: string, line: string): Promise<string[]> { ... }
    // async runMeterpreterSingle(sid: string, command: string): Promise<any> { ... }
    // async meterpreterScript(sid: string, script: string): Promise<any> { ... }
    // async directorySeparator(sid: string): Promise<string> { ... }
    // async ringRead(sid: string): Promise<any> { ... }
    // async ringPut(sid: string, data: string | Uint8Array): Promise<any> { ... }
    // async ringLast(sid: string): Promise<any> { ... }
    // async ringClear(sid: string): Promise<any> { ... }
    // async sessionDetach(sid: string): Promise<any> { ... }
    // async sessionKill(sid: string): Promise<any> { ... }

}