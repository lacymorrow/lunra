# Contributing to Lunra

These guidelines keep the codebase secure, maintainable, and production-ready.

## Principles

- Security-first: validate inputs, never bypass auth/RLS, never commit secrets
- Prefer server components; keep files under ~700 lines; DRY
- Use clear names; small, composable modules
- Error handling with meaningful messages and proper HTTP status codes

## Project Structure

- API routes: `app/api/**/route.ts`
- Services (server): `lib/services/*`
- Client-safe config: `lib/*-config.ts`
- Types: `types/database.ts`
- Auth context: `contexts/auth-context.tsx`
- Data manager: `lib/data-manager.ts`

## Payments

- Webhooks must validate signatures
- Handle events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Provide manual sync fallback via `POST /api/stripe/sync-subscription`

## Environment

Required vars: see `docs/README.md` → Environment. Do not hardcode secrets.

## Testing

- Happy path and error paths
- Payment diagnostics: `GET /api/dev/test-payment-flow`
- Stripe config check: `GET /api/dev/check-stripe-config`

## PR Checklist

- [ ] No secrets committed; env documented
- [ ] Server/client boundaries respected
- [ ] Errors handled with useful messages
- [ ] Unit or integration tests added where applicable
- [ ] Docs updated if behavior or setup changed

## Coding Standards

- TypeScript: strict typing; avoid `any`
- Guard clauses over deep nesting; early returns
- Keep modules focused and readable

## Deployment

- Verify diagnostic endpoints show `overallHealth: "healthy"`
- Ensure production webhook endpoint and secret configured


