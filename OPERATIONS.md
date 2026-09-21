# Backstop operations

## Readiness

The public readiness endpoint is:

```text
GET /api/health
```

A healthy response returns HTTP 200 and includes:

```json
{
  "ok": true,
  "service": "backstop-api",
  "databaseConnected": true,
  "authConfigured": true,
  "uptimeSeconds": 123,
  "commit": "abcdef123456"
}
```

The endpoint returns HTTP 503 when PostgreSQL cannot be reached or the Neon Auth endpoint is not configured.

## Request logging

Production API requests emit one JSON log entry after the response completes.

Logged fields:

- generated request ID
- HTTP method
- path without query-string data
- response status
- request duration in milliseconds

The request logger does not intentionally write request bodies, passwords or Bearer tokens.

Every API response also includes an `X-Request-Id` header so a user-visible failure can be correlated with Render logs.

## Rate limits

Current limits are intentionally conservative for the free single-instance deployment:

- public scans: 20 requests per 10 minutes per connection/IP
- authenticated Backstop APIs: 300 requests per 5 minutes per connection/IP

Rate-limit state is in process memory. This is suitable for one Render instance but must move to shared state before horizontal scaling.

## Account lifecycle

Signed-in users can download a JSON export from Account settings.

Permanent deletion:

1. requires typing `DELETE`
2. deletes resolution events/cases, reminders, notification preferences and protected purchases
3. deletes the Neon Auth user in the same PostgreSQL transaction
4. relies on Neon Auth foreign-key cascades to delete auth sessions/accounts
5. causes protected APIs to reject any stale JWT because middleware confirms the auth user still exists

## Security headers

Production responses include:

- HSTS
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Cross-Origin-Opener-Policy

The CSP allows the application origin, Google Fonts assets and the configured Neon Auth origin.

## Free-tier operating notes

Render Free can sleep during inactivity and has limited CPU/RAM. Browser-rendered Playwright fallback remains disabled in the hosted free deployment.

Neon is the source of truth for authenticated purchase data. The local Docker database remains useful for development.

Before a wider public launch, define the formal business privacy notice/terms, monitoring and alerting, retention periods and a tested backup/restore procedure.
