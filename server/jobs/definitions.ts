// Pattern for background jobs. Add a new job by creating a JobDefinition and listing it in registry.ts.
export interface JobContext {
  log: (message: string) => void;
}

export interface JobDefinition<T extends object = Record<string, unknown>> {
  name: string;
  handler: (data: T, ctx: JobContext) => Promise<void>;
  retryLimit: number;
  retryDelaySeconds: number;
  // Cron expression; the job is scheduled only by the worker process.
  cron?: string;
  // Account-scoped jobs carry { tenantId, accountId } and never overlap for the same account.
  accountScoped?: boolean;
}

export interface AccountJobData {
  tenantId: string;
  accountId: string;
  [key: string]: unknown;
}

export function accountJobKey(data: Pick<AccountJobData, "tenantId" | "accountId">): string {
  return `${data.tenantId}:${data.accountId}`;
}
