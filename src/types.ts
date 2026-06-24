export type Account = {
  username: string;
  password: string;
};

export type WorkerEnv = {
  PZHTTP_ACCOUNTS: string;
  PZHTTP_PASSWORDS: string;
  RUN_INTERVAL_HOURS?: string;
  MANUAL_RUN_TOKEN: string;
  SIGNIN_STATE: KVNamespace;
};

export type RunOptions = {
  force: boolean;
  now: Date;
  targetAccount?: string;
};

export type StoredAccountState = {
  username?: string;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  successCount?: number;
};

export type AccountRunResult = {
  account: string;
  status: "success" | "skipped" | "failed";
  lastSuccessAt?: string;
  nextDueAt?: string;
  error?: string;
};

export type RunSummary = {
  ok: boolean;
  force: boolean;
  intervalHours: number;
  checkedAt: string;
  total: number;
  results: AccountRunResult[];
};
