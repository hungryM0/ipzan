import { parseAccounts } from "./accounts";
import { errorMessage } from "./errors";
import { parseIntervalHours, runDueAccounts } from "./scheduler";

export default {
  async scheduled(_controller, env) {
    const summary = await runDueAccounts(env, { force: false, now: new Date() });
    console.log(JSON.stringify(summary));
  },

  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      return jsonResponse({ ok: false, error: errorMessage(error) }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      accounts: parseAccounts(env.PZHTTP_ACCOUNTS, env.PZHTTP_PASSWORDS).length,
      intervalHours: parseIntervalHours(env.RUN_INTERVAL_HOURS),
    });
  }

  if (url.pathname === "/run" && request.method === "POST") {
    if (request.headers.get("Authorization") !== `Bearer ${env.MANUAL_RUN_TOKEN}`) {
      return jsonResponse({ ok: false, error: "unauthorized" }, 401);
    }

    const summary = await runDueAccounts(env, {
      force: url.searchParams.get("force") === "1",
      now: new Date(),
      targetAccount: url.searchParams.get("account") ?? undefined,
    });

    return jsonResponse(summary);
  }

  return jsonResponse({ ok: false, error: "not_found" }, 404);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
