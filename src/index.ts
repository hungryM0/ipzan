import { parseAccounts } from "./accounts";
import { runDueAccounts } from "./scheduler";
import type { WorkerEnv } from "./types";

export default {
  async scheduled(
    _controller: ScheduledController,
    env: WorkerEnv,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const summary = await runDueAccounts(env, {
      force: false,
      now: new Date(),
    });

    console.log(JSON.stringify(summary));
  },

  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        accounts: parseAccounts(env.PZHTTP_ACCOUNTS, env.PZHTTP_PASSWORDS).length,
        intervalHours: getIntervalHours(env),
      });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      const auth = request.headers.get("Authorization") ?? "";
      if (auth !== `Bearer ${env.MANUAL_RUN_TOKEN}`) {
        return jsonResponse({ ok: false, error: "unauthorized" }, 401);
      }

      const summary = await runDueAccounts(env, {
        force: url.searchParams.get("force") === "1",
        now: new Date(),
        targetAccount: url.searchParams.get("account")?.trim() || undefined,
      });

      return jsonResponse(summary);
    }

    return jsonResponse({ ok: false, error: "not_found" }, 404);
  },
} satisfies ExportedHandler<WorkerEnv>;

function getIntervalHours(env: WorkerEnv): number {
  const value = Number(env.RUN_INTERVAL_HOURS ?? "170");
  return Number.isFinite(value) && value > 0 ? value : 170;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
