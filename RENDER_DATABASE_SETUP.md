# Render: Connect Web Service to PostgreSQL

If your backend shows **`getaddrinfo ENOTFOUND dpg-xxxxx-a`** or the app is empty, the Web Service is using the wrong database URL.

## Fix (2 minutes)

1. **Render Dashboard** → your **PostgreSQL** service (the database).
2. Open **Connections** (or **Info**).
3. Copy the **External Database URL** (host must end with `.oregon-postgres.render.com` or similar).
4. **Render Dashboard** → your **Web Service** (the backend app).
5. Go to **Environment** → edit or add **`DATABASE_URL`**.
6. Paste the **External** URL as the value → **Save Changes**.
7. Trigger a **redeploy** (Deploy → **Deploy latest commit** or **Clear build cache & deploy**).

After redeploy, the backend will connect and tables will be created automatically on first request.

## Rule

- **Internal URL** = host like `dpg-xxxxx-a` (no domain). Often does **not** resolve from Web Services → avoid.
- **External URL** = host like `dpg-xxxxx-a.oregon-postgres.render.com` → **use this** for `DATABASE_URL`.

See also: **RENDER_BACKEND_DEPLOYMENT.md** (Troubleshooting section).
