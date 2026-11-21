# API

> [!NOTE]
> Placeholder page. Replace with the real API reference.

## Authentication

Find your API key under **Settings → API key**. Send it in the `Authorization` header.

```ts
const res = await fetch("https://api.northstar.example/v1/reports", {
  headers: { Authorization: `Bearer ${process.env.NORTHSTAR_API_KEY}` },
});
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/v1/reports` | List reports |
| POST | `/v1/imports` | Upload a file |

### Rate limits

Placeholder: describe rate limits here.
