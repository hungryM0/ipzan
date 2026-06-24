import { maskUsername, parseAccounts } from "./accounts";
import { IpzanClient } from "./ipzan-client";
import type { Account, AccountRunResult, RunOptions, RunSummary, StoredAccountState, WorkerEnv } from "./types";

const DEFAULT_INTERVAL_HOURS = 170;
const HOUR_MS = 60 * 60 * 1000;

export async function runDueAccounts(env: WorkerEnv, options: RunOptions): Promise<RunSummary> {
  const allAccounts = parseAccounts(env.PZHTTP_ACCOUNTS, env.PZHTTP_PASSWORDS);
  const accounts = selectAccounts(allAccounts, options.targetAccount);
  const intervalHours = parseIntervalHours(env.RUN_INTERVAL_HOURS);
  const client = new IpzanClient();
  const results: AccountRunResult[] = [];

  if (options.targetAccount && accounts.length === 0) {
    results.push({
      account: maskUsername(options.targetAccount),
      status: "failed",
      error: "account_not_found",
    });
  }

  for (const account of accounts) {
    results.push(await runOneAccount(env, client, account, intervalHours, options));
  }

  return {
    ok: results.every((result) => result.status !== "failed"),
    force: options.force,
    intervalHours,
    checkedAt: options.now.toISOString(),
    total: accounts.length,
    results,
  };
}

function selectAccounts(accounts: Account[], targetAccount: string | undefined): Account[] {
  const target = targetAccount?.trim();
  if (!target) {
    return accounts;
  }

  return accounts.filter((account) => account.username === target);
}

async function runOneAccount(
  env: WorkerEnv,
  client: IpzanClient,
  account: Account,
  intervalHours: number,
  options: RunOptions,
): Promise<AccountRunResult> {
  const accountKey = await stateKey(account.username);
  const maskedUsername = maskUsername(account.username);
  const state = await readState(env, accountKey);
  const dueAt = state.lastSuccessAt
    ? new Date(new Date(state.lastSuccessAt).getTime() + intervalHours * HOUR_MS)
    : null;

  if (!options.force && dueAt && dueAt.getTime() > options.now.getTime()) {
    return {
      account: maskedUsername,
      status: "skipped",
      nextDueAt: dueAt.toISOString(),
    };
  }

  try {
    const token = await client.login(account.username, account.password);
    await client.signIn(token);

    const nextState: StoredAccountState = {
      username: maskedUsername,
      lastAttemptAt: options.now.toISOString(),
      lastSuccessAt: options.now.toISOString(),
      successCount: (state.successCount ?? 0) + 1,
    };
    await writeState(env, accountKey, nextState);

    return {
      account: maskedUsername,
      status: "success",
      lastSuccessAt: nextState.lastSuccessAt,
      nextDueAt: new Date(options.now.getTime() + intervalHours * HOUR_MS).toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const nextState: StoredAccountState = {
      ...state,
      username: maskedUsername,
      lastAttemptAt: options.now.toISOString(),
      lastError: message,
    };
    await writeState(env, accountKey, nextState);

    return {
      account: maskedUsername,
      status: "failed",
      error: message,
      nextDueAt: dueAt?.toISOString(),
    };
  }
}

function parseIntervalHours(value: string | undefined): number {
  const parsed = Number(value ?? DEFAULT_INTERVAL_HOURS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_INTERVAL_HOURS;
  }

  return parsed;
}

async function readState(env: WorkerEnv, key: string): Promise<StoredAccountState> {
  const value = await env.SIGNIN_STATE.get(key, "json");
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as StoredAccountState;
}

async function writeState(env: WorkerEnv, key: string, state: StoredAccountState): Promise<void> {
  await env.SIGNIN_STATE.put(key, JSON.stringify(state));
}

async function stateKey(username: string): Promise<string> {
  const bytes = new TextEncoder().encode(username);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `account:${hex.slice(0, 32)}`;
}
