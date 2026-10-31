# ipzan-worker

品赞 HTTP 代理每周自动签到

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Wrangler](https://img.shields.io/badge/Wrangler-4.156.0-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/wrangler/)

## 一键部署

本项目提供一键部署到 Cloudflare Workers 的最小示例模板，无需服务器即可定时运行：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hungryM0/ipzan)


## API

| 路由 | 方法 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `/health` | `GET` | 无 | 返回服务状态、账号数量、签到间隔 |
| `/run` | `POST` | `Authorization: Bearer <MANUAL_RUN_TOKEN>` | 手动触发到期账号签到 |
| `/run?force=1` | `POST` | `Authorization: Bearer <MANUAL_RUN_TOKEN>` | 忽略间隔，强制尝试所有账号 |
| `/run?account=18888888888&force=1` | `POST` | `Authorization: Bearer <MANUAL_RUN_TOKEN>` | 忽略间隔，只重试指定账号 |
