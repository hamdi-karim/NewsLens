# NewsLens

One clean, fast, personalized feed of articles from **The Guardian**, **The New York Times**, and **NewsAPI.org**.

> This README covers setup only. Architecture, decisions, and trade-offs will be documented as the project progresses.

## Prerequisites

- **Docker** (recommended), or **Node.js 22.12+** for local development
- Free API keys for the three sources:

| Source         | Get a key                                                                   | Variable           |
| -------------- | --------------------------------------------------------------------------- | ------------------ |
| The Guardian   | https://open-platform.theguardian.com/access/                               | `GUARDIAN_API_KEY` |
| New York Times | https://developer.nytimes.com/get-started (enable the _Article Search API_) | `NYT_API_KEY`      |
| NewsAPI.org    | https://newsapi.org/register                                                | `NEWSAPI_API_KEY`  |

## Run with Docker

```bash
cp .env.example .env      # then fill in the three keys
docker compose up --build
```

Open http://localhost:8080.

API keys are injected into the Nginx proxy **when the container starts**. They are never part of the JavaScript bundle or the image.

## Run locally

```bash
cp .env.example .env      # then fill in the three keys
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` exactly like Nginx does in Docker.

### Mock mode (no API keys, no quota)

```bash
VITE_USE_MOCKS=true npm run dev
```

`/api/*` is answered in the browser by [MSW](https://mswjs.io) with the same fixtures the tests use (trimmed real responses in `src/test/fixtures/`), so UI work doesn't spend the free-tier quotas. Mock mode only exists in the dev server; production builds contain no mock code.

## Scripts

| Script               | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Vite dev server with API proxy                      |
| `npm run build`      | Type check + production build                       |
| `npm run preview`    | Preview the production build locally (no API proxy) |
| `npm run lint`       | ESLint                                              |
| `npm run typecheck`  | TypeScript (`tsc -b`)                               |
| `npm run test`       | Vitest (run once)                                   |
| `npm run test:watch` | Vitest watch mode                                   |
| `npm run format`     | Prettier                                            |

## Rate limits

The free tiers are tight, so responses are cached for 5 minutes and searches are debounced:

| Source         | Free-tier limit (approx.)               |
| -------------- | --------------------------------------- |
| The Guardian   | ~1 request/second, ~500/day             |
| New York Times | 5 requests/minute, 500/day              |
| NewsAPI.org    | ~100 requests/day, development use only |

NewsAPI's free plan only covers about the last month, so a search starting earlier skips NewsAPI (without spending a request) and shows results from the other sources.
