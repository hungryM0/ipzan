import { maskUsername, parseAccounts } from "./accounts";
import { errorMessage } from "./errors";
import { login, signIn } from "./ipzan-client";
import type { Account, AccountRunResult, RunOptions, RunSummary, StoredAccountState } from "./types";

const DEFAULT_INTERVAL_HOURS = 170;
const HOUR_MS = 60 * 60 * 1000;

export function parseIntervalHours(value: string | undefined): number {
  const parsed = Number(value || DEFAULT_INTERVAL_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_HOURS;
}

export async function runDueAccounts(env: Env, options: RunOptions): Promise<RunSummary> {
  const allAccounts = parseAccounts(env.PZHTTP_ACCOUNTS, env.PZHTTP_PASSWORDS);
  const target = options.targetAccount?.trim();
  const accounts = target ? allAccounts.filter((account) => account.username === target) : allAccounts;
  const intervalMs = parseIntervalHours(env.RUN_INTERVAL_HOURS) * HOUR_MS;
  const results: AccountRunResult[] = [];

  if (target && accounts.length === 0) {
    results.push({ account: maskUsername(target), status: "failed", error: "account_not_found" });
  }

  for (const account of accounts) {
    results.push(
      await runOneAccount(env.SIGNIN_STATE, account, intervalMs, options).catch(
        (error): AccountRunResult => ({
          account: maskUsername(account.username),
          status: "failed",
          error: errorMessage(error),
        }),
      ),
    );
  }

  return {
    ok: results.every((result) => result.status !== "failed"),
    force: options.force,
    intervalHours: intervalMs / HOUR_MS,
    checkedAt: options.now.toISOString(),
    total: accounts.length,
    results,
  };
}

async function runOneAccount(
  kv: KVNamespace,
  account: Account,
  intervalMs: number,
  { force, now }: RunOptions,
): Promise<AccountRunResult> {
  const key = await stateKey(account.username);
  const masked = maskUsername(account.username);
  const state = (await kv.get<StoredAccountState>(key, "json")) ?? {};
  const dueAt = state.lastSuccessAt ? new Date(Date.parse(state.lastSuccessAt) + intervalMs) : undefined;

  if (!force && dueAt && dueAt > now) {
    return { account: masked, status: "skipped", nextDueAt: dueAt.toISOString() };
  }

  const nowIso = now.toISOString();

  try {
    await signIn(await login(account.username, account.password));
  } catch (error) {
    const message = errorMessage(error);
    const warning = await writeState(kv, key, {
      ...state,
      username: masked,
      lastAttemptAt: nowIso,
      lastError: message,
    });

    return { account: masked, status: "failed", error: message, nextDueAt: dueAt?.toISOString(), ...warning };
  }

  const warning = await writeState(kv, key, {
    username: masked,
    lastAttemptAt: nowIso,
    lastSuccessAt: nowIso,
    successCount: (state.successCount ?? 0) + 1,
  });

  return {
    account: masked,
    status: "success",
    lastSuccessAt: nowIso,
    nextDueAt: new Date(now.getTime() + intervalMs).toISOString(),
    ...warning,
  };
}

/** 状态写入失败不影响签到结果，只作为警告返回。 */
async function writeState(
  kv: KVNamespace,
  key: string,
  state: StoredAccountState,
): Promise<{ warning?: string }> {
  try {
    await kv.put(key, JSON.stringify(state));
    return {};
  } catch (error) {
    return { warning: `状态写入失败: ${errorMessage(error)}` };
  }
}

async function stateKey(username: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(username));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `account:${hex.slice(0, 32)}`;
}
