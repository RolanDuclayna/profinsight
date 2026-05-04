# ProfInsight API

Backend workspace for the Chrome extension.

## Run locally

```bash
cd apps/api
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:8787/health
```

Professor lookup:

```bash
curl -X POST http://localhost:8787/api/professors \
  -H "Content-Type: application/json" \
  -d '{"school":"Cal Poly Pomona","professors":["Tony Diaz"]}'
```

The current provider is a typed mock seed so the extension can integrate before a permanent data provider is selected.
