# Deploying VoiceGuard-AI

The app ships as a **single container**: FastAPI serves the API, the WebSocket,
and the built React frontend from one origin. No CORS setup, no separate static
host, one URL.

Everything below assumes you're at the repository root.

## Sizing

The detector is 316M parameters — 1.26 GB of weights, about **2.3 GB resident**
once torch and librosa are loaded. Anything smaller than ~4 GB RAM will fail, so
the common free tiers (Render 512 MB, Fly 256 MB) are not viable, and serverless
platforms can't hold the WebSocket open.

The image bakes the model in at build time, so it lands around **4–5 GB**. That
is deliberate: without it, the first request after every cold start waits about
five minutes for a 1.2 GB download.

## Hugging Face Spaces (recommended)

Free CPU tier gives 16 GB RAM, 2 vCPU and 50 GB disk — comfortable headroom.

### 1. Create the Space

Go to https://huggingface.co/new-space and choose:

- **SDK:** Docker → *Blank*
- **Hardware:** CPU basic (free)
- **Visibility:** Public

### 2. Push the code

The `hf` CLI is already installed inside the backend venv (it comes with
`transformers`), but it is **not on your PATH**, so a bare `hf auth login` will
report that the command isn't recognised. Call it by path from the repo root:

```bash
# Sign in — prompts for a token from huggingface.co/settings/tokens
backend/venv/Scripts/hf.exe auth login       # Windows
# backend/venv/bin/hf auth login             # macOS / Linux

# Confirm it worked
backend/venv/Scripts/hf.exe auth whoami
```

Create the token at https://huggingface.co/settings/tokens with the **Write**
role — read-only tokens can't push a Space.

If you'd rather type plain `hf` from anywhere, install it globally instead:

```bash
pip install -U "huggingface_hub[cli]"
```

Then push this repo to the Space:

```bash
git remote add space https://huggingface.co/spaces/<your-username>/<space-name>
git push space main
```

Logging in above installs a git credential helper, so the push won't ask for a
password. If it does, use your Hugging Face username and paste the **write**
token as the password.

### 3. Give the Space its README

Spaces read configuration from YAML frontmatter at the top of `README.md`, which
this repo's GitHub README doesn't carry. Swap it in on a deploy branch so the
GitHub README stays clean:

```bash
git checkout -b space-deploy
cp deploy/space-README.md README.md
git commit -am "Space configuration"
git push space space-deploy:main
git checkout main
```

Repeat that branch step whenever you redeploy.

### 4. Watch it build

The first build takes roughly 10–15 minutes — installing torch and baking in the
model weights dominate. Follow progress under the Space's **Logs** tab. When
`GET /api/health` returns `detector_ready: true`, it's serving.

Your URL: `https://<your-username>-<space-name>.hf.space`

## Anywhere else

The image is a plain container, so any host with ≥4 GB RAM and WebSocket support
works the same way:

```bash
docker build -t voiceguard-ai .
docker run -p 7860:7860 voiceguard-ai
```

Then open http://localhost:7860.

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `7860` | Listen port |
| `STATIC_DIR` | `/app/static` | Built frontend. Unset it to run API-only. |
| `HF_HOME` | `/home/app/.cache/huggingface` | Model cache location |

The frontend is built into the image with relative `/api` and `/ws` paths. Only
set `VITE_API_BASE_URL` at build time if you split the frontend onto a separate
host, and remember to add that origin to `cors_origins` in
`backend/app/core/config.py` if you do.

## Operational notes

- **Single worker on purpose.** Each worker loads its own ~2.3 GB copy of the
  model, and the rate limiter keeps counters in process memory, so replicas
  would multiply memory use and weaken the limit. Scale with more instances
  behind a load balancer, not more workers per instance.
- **SQLite is ephemeral** unless you mount a volume at the database path. On the
  Spaces free tier the history list resets on every restart and rebuild. Attach
  persistent storage, or move to Postgres, if that matters.
- **No authentication.** Anyone with the URL can analyse audio and see the
  shared history. A per-IP rate limit (20 requests/minute) and a 25 MB upload
  cap are the only guards. Put it behind a proxy or private network if that
  isn't acceptable.
- **First request after a cold start** still pays ~20 seconds of model load from
  the baked-in cache. `/api/health` reports `detector_ready` so you can tell
  whether the model is up before demoing.
