# rti-compro-api

Minimal Express + Sequelize (MySQL) setup with useful middlewares and tooling.

## Quick start

1. Copy env

```pwsh
Copy-Item .env.example .env
```

2. Edit `.env` with your DB credentials.

3. Install deps (already installed if you're reading this in the repo)

```pwsh
npm install
```

4. Run in dev mode (auto-reload)

```pwsh
npm run dev
```

Open http://localhost:3000/status

## Notes

- Sequelize is configured in `db/models/index.js`.
- Server entry is `index.js`.
