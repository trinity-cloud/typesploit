import { RpcClient, RpcOptions } from './rpc';
import { AuthManager } from './managers/AuthManager';
import { ConsoleManager } from './managers/ConsoleManager';
import { CoreManager } from './managers/CoreManager';
import { DbManager } from './managers/DbManager';
import { JobManager } from './managers/JobManager';
import { ModuleManager } from './managers/ModuleManager';
import { PluginManager } from './managers/PluginManager';
import { SessionManager } from './managers/SessionManager';
import { MsfAuthError, MsfRpcError } from './errors';
import * as Methods from './methods';

// Re-export core types and classes for easier import
// export * from './types'; // REMOVED: Cannot re-export from a .d.ts file
export * from './errors';
export * from './module';
export * from './session';
export * from './workspace';
export * from './db_table';
export * from './console';
export * from './rpc'; // Export RpcOptions too

export class MetasploitClient {
    private rpc: RpcClient;
    private _auth: AuthManager;
    private _core: CoreManager;
    private _modules: ModuleManager;
    private _sessions: SessionManager;
    private _db: DbManager;
    private _consoles: ConsoleManager;
    private _jobs: JobManager;
    private _plugins: PluginManager;

    private loggedIn: boolean = false;
    private connectionOptions: RpcOptions;

    constructor(options: RpcOptions) {
        this.connectionOptions = options;
        this.rpc = new RpcClient(options);
        this._auth = new AuthManager(this.rpc);
        this._core = new CoreManager(this.rpc);
        this._modules = new ModuleManager(this.rpc);
        this._sessions = new SessionManager(this.rpc);
        this._db = new DbManager(this.rpc); // DbManager initializes WorkspaceManager internally
        this._consoles = new ConsoleManager(this.rpc);
        this._jobs = new JobManager(this.rpc);
        this._plugins = new PluginManager(this.rpc);

         // If a token is provided, assume we are already logged in
         if (options.token) {
            this.loggedIn = true;
        }
    }

     /**
     * Explicitly login using username/password.
     * Required if a token is not provided during construction.
     */
     async login(): Promise<boolean> {
         if (this.loggedIn) {
             return true;
         }
         if (!this.connectionOptions.password) {
             throw new MsfAuthError('Login requires a password if no token is provided.');
         }
         try {
             // The RpcClient.call method handles token storage on successful auth.login
             await this.rpc.call(Methods.AuthLogin, [
                 this.connectionOptions.username || 'msf',
                 this.connectionOptions.password
             ]);
             this.loggedIn = true;
             return true;
         } catch (error) {
             this.loggedIn = false;
             if (error instanceof MsfAuthError || error instanceof MsfRpcError) {
                throw error; // Re-throw specific errors
             }
             // Wrap other potential errors
             throw new MsfAuthError(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
         }
     }

     /**
      * Logout the current session (invalidates temporary token).
      */
     async logout(): Promise<boolean> {
         if (!this.loggedIn && !this.connectionOptions.token) {
             return false;
         }

         try {
             // The auth.logout method expects the token as an argument, which is NOT
             // automatically passed by the RPC client, so we need to pass it explicitly
             const response = await this.rpc.call(Methods.AuthLogout, [this.rpc.getToken()]);
             this.loggedIn = false;
             return true;
         } catch (e) {
             console.error('Error logging out:', e);
             // Even if logout fails, we should still consider the client logged out locally
             this.loggedIn = false;
             return false;
         }
     }


    // --- Manager Getters ---
    get auth() { return this._auth; }
    get core() { return this._core; }
    get modules() { return this._modules; }
    get sessions() { return this._sessions; }
    get db() { return this._db; }
    get consoles() { return this._consoles; }
    get jobs() { return this._jobs; }
    get plugins() { return this._plugins; }
}