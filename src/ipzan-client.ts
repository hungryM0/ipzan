import { generateObfuscatedAccount } from "./obfuscator";

const API_ORIGIN = "https://service.ipzan.com";
const LOGIN_SOURCE = "ipzan-home-one";

type ApiResponse<T> = {
  code?: number;
  data?: T;
  message?: string;
};

type LoginData = {
  token?: string;
};

export class IpzanClient {
  async login(username: string, password: string): Promise<string> {
    const response = await fetch(`${API_ORIGIN}/users-login`, {
      method: "POST",
      headers: loginHeaders(),
      body: JSON.stringify({
        account: generateObfuscatedAccount(username, password),
        source: LOGIN_SOURCE,
      }),
    });

    const data = await readJson<ApiResponse<LoginData>>(response);
    if (!response.ok || data.code !== 0 || !data.data?.token) {
      throw new Error(data.message || `登录失败: HTTP ${response.status}`);
    }

    return data.data.token;
  }

  async signIn(token: string): Promise<void> {
    const response = await fetch(`${API_ORIGIN}/home/userWallet-receive`, {
      method: "GET",
      headers: authedHeaders(token),
    });

    const data = await readJson<ApiResponse<unknown>>(response);
    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || `签到失败: HTTP ${response.status}`);
    }
  }
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`响应不是 JSON: HTTP ${response.status}`);
  }
}

function loginHeaders(): HeadersInit {
  return {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "authorization": "Bearer null",
    "content-type": "application/json;charset=UTF-8",
    "cookie": "locale=en-us",
    "origin": "https://www.ipzan.com",
    "referer": "https://www.ipzan.com/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": browserUserAgent(),
  };
}

function authedHeaders(token: string): HeadersInit {
  return {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "authorization": `Bearer ${token}`,
    "cookie": "locale=en-us",
    "origin": "https://www.ipzan.com",
    "referer": "https://www.ipzan.com/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": browserUserAgent(),
  };
}

function browserUserAgent(): string {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0";
}
