export type Account = {
  username: string;
  password: string;
};

export type RunOptions = {
  force: boolean;
  now: Date;
  targetAccount?: string | undefined;
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
  nextDueAt?: string | undefined;
  error?: string;
  warning?: string;
};

export type RunSummary = {
  ok: boolean;
  force: boolean;
  intervalHours: number;
  checkedAt: string;
  total: number;
  results: AccountRunResult[];
};
