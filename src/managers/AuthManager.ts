import { RpcClient } from '../rpc';
import * as Methods from '../methods';

/**
 * Authentication manager.
 */
export class AuthManager {
  constructor(private rpc: RpcClient) {}

  async login(username: string, password: string): Promise<any> {
    return this.rpc.call(Methods.AuthLogin, [username, password]);
  }

  async logout(): Promise<any> {
    return this.rpc.call(Methods.AuthLogout);
  }

  async tokenList(): Promise<any> {
    return this.rpc.call(Methods.AuthTokenList);
  }
  /**
   * Add a new authentication token.
   */
  async tokenAdd(token: string): Promise<any> {
    return this.rpc.call(Methods.AuthTokenAdd, [token]);
  }
  /**
   * Remove an existing authentication token.
   */
  async tokenRemove(token: string): Promise<any> {
    return this.rpc.call(Methods.AuthTokenRemove, [token]);
  }
  /**
   * Generate a new authentication token.
   */
  async tokenGenerate(): Promise<string> {
    const res = await this.rpc.call(Methods.AuthTokenGenerate);
    return res.token;
  }
}