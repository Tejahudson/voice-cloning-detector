# Running the public demo (Cloudflare Tunnel)

The backend runs on your machine and is exposed at a public `https://` URL.
Free, no account, and the model is already cached locally so there are no cold
starts. The URL is live only while both processes below are running.

`cloudflared` is already installed (`winget install Cloudflare.cloudflared`).

## Start it

**1. Build the frontend** (only needed after frontend changes):

```bash
cd frontend && npm run build && cd ..
```

**2. Start the backend**, serving the built app and accepting any frontend origin:

```bash
cd backend
CORS_ORIGINS='["*"]' STATIC_DIR="../frontend/dist" \
  venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 7860
```

Wait until `curl http://127.0.0.1:7860/api/health` reports `"detector_ready": true`
(about 20 seconds).

**3. Open the tunnel** in a second terminal:

```bash
"/c/Program Files (x86)/cloudflared/cloudflared.exe" tunnel --url http://localhost:7860
```

It prints a URL like `https://random-words-here.trycloudflare.com`. That single
link serves the whole app — frontend, API and WebSocket. Share it.

## The URL changes every restart

Free quick-tunnels issue a new hostname each time. Nothing to configure if you
share the tunnel URL directly, since the frontend is served from the same
origin.

It only matters if you also host the frontend on Vercel. In that case open the
Vercel site, find **Backend connected / unreachable** in the sidebar, click it,
and paste the current tunnel URL. It's saved in your browser, so you only redo
this when the tunnel restarts — no rebuild or redeploy.

For a permanent hostname instead, you need a domain on Cloudflare and a named
tunnel (`cloudflared tunnel create`), which is a paid-domain path rather than a
free one.

## Optional: frontend on Vercel

Only worth it if you want the UI to stay up while your laptop is off — it will
show "Backend unreachable" until the tunnel is running.

```bash
npx vercel --prod
```

`vercel.json` already sets the build command, output directory and SPA
rewrites. Leave `VITE_API_BASE_URL` unset and use the in-app Backend panel, or
set it in Vercel's environment variables if you have a stable backend URL.

## Verified working

Over the public tunnel: `GET /api/health`, the SPA at `/` and `/analyze`,
multipart upload to `/api/analyze/upload`, and the full `wss://` streaming
analysis through to a `complete` verdict.

## Notes

- Anyone with the link can analyse audio and see the shared history — there's no
  authentication. Stop the tunnel when you're done demoing.
- Keep both terminals open. Closing either kills the public URL.
- Uploads are capped at 25 MB and rate-limited to 20 requests/minute per IP.
