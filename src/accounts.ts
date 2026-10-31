import type { Account } from "./types";

export function parseAccounts(rawUsernames: string, rawPasswords: string): Account[] {
  const usernames = parseLines(rawUsernames);
  const passwords = parseLines(rawPasswords);

  if (usernames.length !== passwords.length) {
    throw new Error(`账号和密码数量不一致: ${usernames.length}/${passwords.length}`);
  }

  const accounts: Account[] = [];
  const seen = new Set<string>();

  for (const [index, username] of usernames.entries()) {
    const password = passwords[index];
    if (!username || !password) {
      throw new Error(`账号配置格式错误: 第 ${index + 1} 行`);
    }

    if (seen.has(username)) {
      continue;
    }

    seen.add(username);
    accounts.push({ username, password });
  }

  return accounts;
}

function parseLines(raw: string): string[] {
  return raw
    .replaceAll("\\n", "\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export function maskUsername(username: string): string {
  if (username.length <= 5) {
    return `${username.slice(0, 1)}***`;
  }

  return `${username.slice(0, 3)}****${username.slice(-2)}`;
}
