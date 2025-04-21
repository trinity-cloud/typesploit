import { RpcClient } from '../rpc';
import * as Methods from '../methods';

/**
 * Manager for Metasploit jobs.
 */
export class JobManager {
  constructor(private rpc: RpcClient) {}

  /**
   * List running jobs.
   */
  async list(): Promise<Record<string, any>> {
    return this.rpc.call(Methods.JobList);
  }
  /**
   * Stop a running job.
   */
  async stop(jobId: number): Promise<any> {
    return this.rpc.call(Methods.JobStop, [jobId]);
  }
  /**
   * Get info for a job.
   */
  async info(jobId: number): Promise<any> {
    return this.rpc.call(Methods.JobInfo, [jobId]);
  }
  /**
   * Get job information by its UUID.
   * Note: This requires listing all jobs and filtering locally, as there isn't a direct RPC call.
   */
  async infoByUuid(uuid: string): Promise<any | null> {
    const jobs = await this.list();
    for (const jobId in jobs) {
        if (jobs[jobId] && jobs[jobId].uuid === uuid) {
            return jobs[jobId]; 
        }
    }
    return null;
  }

  // TODO: implement stop, info
}