import { generateObfuscatedAccount } from "./obfuscator";

const API_ORIGIN = "https://service.ipzan.com";
const LOGIN_SOURCE = "ipzan-home-one";

const BASE_HEADERS = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
  "cookie": "locale=en-us",
  "origin": "https://www.ipzan.com",
  "referer": "https://www.ipzan.com/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
};

type ApiResponse<T> = {
  code?: number;
  data?: T;
  message?: string;
};

export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_ORIGIN}/users-login`, {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "authorization": "Bearer null",
      "content-type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify({
      account: generateObfuscatedAccount(username, password),
      source: LOGIN_SOURCE,
    }),
  });

  const data = await readJson<{ token?: string }>(response);
  const token = data.data?.token;
  if (!response.ok || data.code !== 0 || !token) {
    throw new Error(data.message || `登录失败: HTTP ${response.status}`);
  }

  return token;
}

export async function signIn(token: string): Promise<void> {
  const response = await fetch(`${API_ORIGIN}/home/userWallet-receive`, {
    headers: { ...BASE_HEADERS, "authorization": `Bearer ${token}` },
  });

  const data = await readJson<unknown>(response);
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `签到失败: HTTP ${response.status}`);
  }
}

async function readJson<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return await response.json<ApiResponse<T>>();
  } catch {
    throw new Error(`响应不是 JSON: HTTP ${response.status}`);
  }
}
