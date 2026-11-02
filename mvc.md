# CampusEats — MVC Implementation Guide (for GitHub Copilot)

> **Audience:** GitHub Copilot / Copilot Chat / Agent mode in VS Code, and human developers.
> **Purpose:** Apply MVC consistently across the entire CampusEats project (Express backend + Next.js frontend).
> **Source of truth:** `docs/architecture.md`. If this file conflicts with it, `architecture.md` wins; report the conflict.
>
> **Tip:** Copy this file to `.github/copilot-instructions.md` (or reference it with `#file:mvc.md` in Copilot Chat) so Copilot always follows it.

---

## 0. Hard rules (read first)

1. **JavaScript only (ES modules).** Never generate `.ts` / `.tsx`. Use JSDoc for types.
2. **Dependency direction is one-way:**
   `routes → middleware → controllers → services → repositories → database`
   Lower layers never import higher layers.
3. **Controllers are thin.** They only parse input, call ONE service function, and return the response envelope.
4. **Business logic lives only in services.** No pricing, escrow, payout, cancellation, order-status, QR, or authorization-by-ownership rules in routes, controllers, or React components.
5. **Database access lives only in repositories** (or models). Services never write raw queries inline when a repository function exists or is warranted.
6. **Never trust the client** for: role, price, total, order status, payment state, balances, earnings, QR validity.
7. **Authentication = Better Auth sessions.** No custom JWT, no tokens in `localStorage`.
8. **Authorize on the server twice:** role check (middleware) AND resource ownership check (service).
9. **Money:** integer minor units only (e.g. paisa). Never floats. Ledger entries are append-only and idempotent.
10. **Do not** refactor working code you were not asked to touch. Migrate legacy routes **one at a time** (see §9).
11. **Do not** create empty files just to match a diagram.
12. **Do not** invent endpoints, env vars, collections, or admin accounts. Use the existing ones or ask.

---

## 1. Project layout

### Backend (`backend/src`)

```text
backend/src/
├── config/            # env.js, db.js (Mongo connection + index creation)
├── models/            # (Optional) Mongoose schemas / persisted-shape definitions
├── repositories/      # DB queries only: <resource>.js
├── services/          # Business rules: <resource>.js (+ order-workflow.js, finance.js)
├── controllers/       # HTTP <-> service translation: <resource>.js
├── routes/            # Route registration + middleware wiring: <resource>.js
├── middleware/        # require-session, require-role, validate, rate-limit, error-handler
├── validators/        # Zod schemas: <resource>.schema.js
├── utils/             # app-error.js, async-handler.js, respond.js
├── integrations/      # bkash/, cloudinary/, notifications/, realtime/ (called only from services)
├── app.js             # Express app assembly
└── server.js          # Process entry
backend/tests/         # Node tests (isolated); Supertest for HTTP
```

### Frontend (`apps/web/src` or `frontend/src` — use whichever exists)

```text
src/
├── app/               # VIEW: Next.js App Router pages/layouts (composition only)
├── components/        # VIEW: ui/, shared/, layouts/
├── features/<name>/   # VIEW + CONTROLLER-ish: components/, hooks/, schemas.js, index.js
├── hooks/             # Cross-feature hooks
├── services/          # MODEL access: api-client.js, <resource>-service.js, mock/
├── lib/               # auth.js, auth-client.js, session.js, utils.js
└── proxy.js           # Early route guard ONLY (not the security boundary)
```

---

## 2. Layer contracts (backend)

| Layer | MAY | MUST NOT |
| --- | --- | --- |
| **Route** | Mount path, attach `requireSession`, `requireRole`, `validate`, rate limit, then a controller | Contain logic, DB calls, or business rules |
| **Middleware** | Resolve session, check role, validate input, rate-limit, map errors | Contain resource-specific business rules |
| **Controller** | Read `req.validated`, `req.user`; call a service; send envelope; set status code | Touch the DB, compute money/status, call integrations |
| **Service** | Enforce rules, ownership, state transitions, call repositories & integrations, start transactions | Read `req`/`res`, set HTTP codes, import controllers/routes |
| **Repository** | Run queries, atomic updates, aggregation; return plain objects | Apply business rules, throw HTTP errors (return `null` instead) |
| **Model** | Define schema, types, indexes, constraints | Contain HTTP or authorization behavior |
| **Serializer / DTO** | Shape response by role and stage (e.g. `serializeOrder`) | Be skipped — never return raw DB documents |

**Naming:** files `kebab-case` or resource name (`orders.js`); functions `camelCase`; services export named functions (or a plain object), not classes, unless state is needed.

---

## 3. Shared backend utilities (create once, reuse everywhere)

### `utils/app-error.js`

```js
export class AppError extends Error {
  /**
   * @param {number} status HTTP status
   * @param {string} code   Machine code e.g. FORBIDDEN, NOT_FOUND, CONFLICT
   * @param {string} message Safe, user-facing message
   */
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (m = 'Bad request', d) => new AppError(400, 'BAD_REQUEST', m, d);
export const unauthorized = (m = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', m);
export const forbidden = (m = 'You do not have permission to perform this action.') => new AppError(403, 'FORBIDDEN', m);
export const notFound = (m = 'Resource not found') => new AppError(404, 'NOT_FOUND', m);
export const conflict = (m = 'Conflicting state', d) => new AppError(409, 'CONFLICT', m, d);
export const unprocessable = (m = 'Invalid input', d) => new AppError(422, 'UNPROCESSABLE', m, d);
```

### `utils/async-handler.js`

```js
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

### `utils/respond.js` — the response envelope (architecture §8)

```js
export const ok = (res, data = null, meta = {}, status = 200) =>
  res.status(status).json({ success: true, data, error: null, meta });

export const created = (res, data, meta = {}) => ok(res, data, meta, 201);
export const noContent = (res) => res.status(204).end();
```

### `middleware/error-handler.js`

```js
import { AppError } from '../utils/app-error.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const known = err instanceof AppError;
  const status = known ? err.status : 500;
  if (!known) console.error({ requestId: req.id, err: err.message }); // swap for Pino/Winston; never log secrets
  res.status(status).json({
    success: false,
    data: null,
    error: {
      code: known ? err.code : 'INTERNAL_ERROR',
      message: known ? err.message : 'Something went wrong.',
      ...(known && err.details ? { details: err.details } : {}),
    },
    meta: {},
  });
}

export const notFoundHandler = (req, res) =>
  res.status(404).json({
    success: false, data: null,
    error: { code: 'NOT_FOUND', message: 'Route not found.' }, meta: {},
  });
```

> Never return stack traces or internal details to clients.

### `middleware/validate.js`

```js
import { unprocessable } from '../utils/app-error.js';

/** @param {{body?:import('zod').ZodTypeAny, query?:any, params?:any}} schemas */
export const validate = (schemas) => (req, _res, next) => {
  const out = {};
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const parsed = schemas[key].safeParse(req[key]);
    if (!parsed.success) {
      return next(unprocessable('Validation failed', parsed.error.flatten()));
    }
    out[key] = parsed.data;
  }
  req.validated = out;
  next();
};
```

### `middleware/require-role.js`

```js
import { forbidden, unauthorized } from '../utils/app-error.js';

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};
```

`require-session.js` must resolve the **Better Auth session** from request headers/cookies and set `req.user = { id, role, ... }`. Role comes from the **server-side user/profile record**, never from the request body.

---

## 4. Backend feature template (copy this for every resource)

Replace `<resource>` (e.g. `shops`, `menu`, `orders`, `riders`, `wallet`, `disputes`, `ratings`, `admin`).

### 4.1 Validator — `validators/<resource>.schema.js`

```js
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParam = z.object({ id: objectId });

export const createShopBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
}).strict();
```

### 4.2 Repository — `repositories/<resource>.js`

```js
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';

const col = () => getDb().collection('shops');

export const findById = (id) => col().findOne({ _id: new ObjectId(id) });

export const findOwnedBy = (ownerUserId) =>
  col().find({ ownerUserId }).sort({ createdAt: -1 }).toArray();

export const insert = async (doc) => {
  const now = new Date();
  const res = await col().insertOne({ ...doc, createdAt: now, updatedAt: now });
  return { _id: res.insertedId, ...doc, createdAt: now, updatedAt: now };
};

/** Atomic: only updates if the filter still matches. Returns updated doc or null. */
export const updateIfOwned = (id, ownerUserId, patch) =>
  col().findOneAndUpdate(
    { _id: new ObjectId(id), ownerUserId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
```

> If the project uses Mongoose, put schema in `models/<Resource>.js` and have the repository call the model. Keep **one** approach per collection. Do not alter Better Auth's own collections.

### 4.3 Service — `services/<resource>.js`

```js
import * as shopsRepo from '../repositories/shops.js';
import { forbidden, notFound } from '../utils/app-error.js';
import { serializeShop } from './shop-serializer.js';

export async function createShop(actor, input) {
  // business rules: one pending application per owner, verified owner only, etc.
  const shop = await shopsRepo.insert({
    ...input,
    ownerUserId: actor.id,       // from session, NEVER from body
    approvalStatus: 'pending',
    isOpen: false,
  });
  return serializeShop(shop);
}

export async function updateShop(actor, shopId, patch) {
  const updated = await shopsRepo.updateIfOwned(shopId, actor.id, patch);
  if (!updated) {
    const exists = await shopsRepo.findById(shopId);
    if (!exists) throw notFound('Shop not found');
    throw forbidden(); // exists but not owned
  }
  return serializeShop(updated);
}
```

### 4.4 Controller — `controllers/<resource>.js`

```js
import * as shopService from '../services/shops.js';
import { ok, created } from '../utils/respond.js';
import { asyncHandler } from '../utils/async-handler.js';

export const create = asyncHandler(async (req, res) => {
  const shop = await shopService.createShop(req.user, req.validated.body);
  created(res, shop);
});

export const update = asyncHandler(async (req, res) => {
  const shop = await shopService.updateShop(req.user, req.validated.params.id, req.validated.body);
  ok(res, shop);
});
```

### 4.5 Route — `routes/<resource>.js`

```js
import { Router } from 'express';
import { requireSession } from '../middleware/require-session.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/shops.js';
import { idParam, createShopBody, updateShopBody } from '../validators/shops.schema.js';

const router = Router();

router.post('/owner/shops',
  requireSession, requireRole('shop_owner'),
  validate({ body: createShopBody }),
  ctrl.create);

router.patch('/owner/shops/:id',
  requireSession, requireRole('shop_owner'),
  validate({ params: idParam, body: updateShopBody }),
  ctrl.update);

export default router;
```

### 4.6 Mount — `app.js`

```js
app.use('/api', shopsRouter);
// ...other routers...
app.use(notFoundHandler);
app.use(errorHandler);   // MUST be last
```

---

## 5. Domain rules to put in services (not controllers)

- **Order status:** keep ONE transition table in `services/order-workflow.js`:
  `placed → confirmed → awaiting_rider → assigned → picked_up → delivered`; terminal: `cancelled`, `rejected`, `disputed`.
  Reject illegal transitions with `conflict(...)`. Do not mix `claimed`/`assigned`/`in_transit` vocabularies.
- **Pricing:** recompute `subtotal`, `deliveryFee`, `total` server-side from DB prices at order creation. Snapshot `priceAtOrder` and item names.
- **Rider claim:** atomic `findOneAndUpdate({ _id, status: 'awaiting_rider', riderUserId: null }, { $set: { riderUserId, status: 'assigned' } })`. No match → `conflict('Order already claimed')`. (Lives in `repositories`, invoked by service.)
- **Escrow / payout / refund:** only via `services/finance.js`. Steps: lock (after trusted webhook) → release (after authorized delivery confirm) → refund (compensating entry). Use idempotency keys and transactions when supported. Ledger is append-only.
- **Split & cancellation percentages** (85/12/3 etc.): single config/policy module, unit-tested, never scattered.
- **QR handover:** server generates token; store only a hash; validate expiry, participant, order state, single-use atomically.
- **Payments:** verify provider callbacks server-side; never fake success; never store credentials.
- **Serialization:** always return through serializers (e.g. `serializeOrder`) that hide fields/verification codes by role and stage.
- **Audit:** admin, payment, escrow, and account-sensitive actions write to `auditLogs` from the service.

---

## 6. Frontend MVC mapping

| MVC role | Frontend location | Rule |
| --- | --- | --- |
| **View** | `app/**/page.js`, `components/**`, `features/*/components` | Render only. No `fetch`, no business rules, no price/status math. |
| **Controller** | `features/*/hooks/*.js` (TanStack Query hooks), form handlers | Call services, manage loading/error/optimistic state, trigger toasts, navigate. |
| **Model / data access** | `services/*.js`, `services/api-client.js`, `services/mock/*` | Only place that calls the API (or mock). Returns plain data. |
| **Validation** | `features/*/schemas.js` (Zod + React Hook Form) | UX only; server re-validates. |

### 6.1 `services/api-client.js`

```js
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', // Better Auth cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'UNKNOWN', e.message ?? 'Request failed', e.details);
  }
  return json?.data ?? null;
}
```

### 6.2 `services/shop-service.js` (swap mock ↔ real in ONE place)

```js
import { apiFetch } from './api-client';
import * as mock from './mock/shops';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'; // never default to true in production

export const shopService = {
  listShops: (filters = {}) =>
    USE_MOCK ? mock.listShops(filters)
             : apiFetch(`/api/shops?${new URLSearchParams(filters)}`),
  getShop: (shopId) =>
    USE_MOCK ? mock.getShop(shopId) : apiFetch(`/api/shops/${shopId}`),
};
```

### 6.3 Hook (controller) — `features/shops/hooks/use-shops.js`

```js
'use client';
import { useQuery } from '@tanstack/react-query';
import { shopService } from '@/services/shop-service';

export const shopKeys = {
  all: ['shops'],
  list: (filters) => ['shops', 'list', filters],
  detail: (id) => ['shops', 'detail', id],
};

export const useShops = (filters) =>
  useQuery({ queryKey: shopKeys.list(filters), queryFn: () => shopService.listShops(filters) });
```

### 6.4 Mutation hook

```js
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderService } from '@/services/order-service';

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order placed'); },
    onError: (e) => toast.error(e.message),
  });
}
```

### 6.5 View — keep it dumb

```jsx
'use client';
import { useShops } from '@/features/shops/hooks/use-shops';
import { ShopCard } from '@/features/shops/components/shop-card';

export function ShopList({ filters }) {
  const { data, isLoading, isError, error } = useShops(filters);
  if (isLoading) return <ShopListSkeleton />;
  if (isError) return <ErrorState message={error.message} />;
  if (!data?.length) return <EmptyState title="No shops found" />;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((s) => <ShopCard key={s.id} shop={s} />)}</div>;
}
```

Every View must handle: **loading, empty, error, success, disabled**.

### 6.6 Frontend security reminders

- Role-aware navigation is UX only. `proxy.js` is an early guard only. The server decides.
- Never compute authoritative totals, balances, or status transitions in components.
- Dynamic-import heavy client modules (QR scanner, charts, maps).
- Server data → TanStack Query; UI state → local state; theme → `next-themes`; session → Better Auth client/server APIs.

---

## 7. Resource checklist (generate these for EACH resource)

For a resource `X`, create in this order:

1. [ ] `validators/X.schema.js` (Zod: params/query/body)
2. [ ] `repositories/X.js` (queries, atomic updates; add indexes in `config/db.js`)
3. [ ] `services/X.js` (rules, ownership, serializer use)
4. [ ] `controllers/X.js` (thin handlers with `asyncHandler`)
5. [ ] `routes/X.js` (middleware chain) and mount in `app.js`
6. [ ] `tests/X.*.test.js` (service unit tests + permission/cross-role cases)
7. [ ] Frontend: `services/X-service.js` (+ `mock/X.js`), `features/X/hooks`, `features/X/components`, page in `app/`
8. [ ] Update `docs/api/README.md` and the Postman collection

### Resource → endpoints map (from architecture §9)

| Resource | Role(s) | Endpoints |
| --- | --- | --- |
| shops/menu | public / `shop_owner` | `GET /api/shops`, `GET /api/shops/:id`, `GET /api/shops/:id/menu`, `POST/PATCH /api/owner/shops…`, `POST/PATCH/DELETE /api/owner/menu-items…` |
| orders | `student`, `shop_owner` | `POST/GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/cancel`, `POST /api/owner/orders/:id/{accept,reject,ready}` |
| rider | `rider` | `GET /api/rider/offers`, `POST /api/rider/orders/:id/claim`, `GET /api/rider/active-delivery`, `POST …/verify-pickup`, `POST …/verify-delivery`, `GET /api/rider/earnings` |
| payments/wallet | `student`, system | `POST /api/payments/checkout`, `POST /api/payments/webhook`, `GET /api/wallet`, `GET /api/transactions` |
| disputes | `student`, `admin` | `POST /api/orders/:id/disputes`, `GET /api/admin/disputes`, `POST /api/admin/disputes/:id/resolve` |
| admin | `admin` | `GET /api/admin/shops/applications`, `POST …/shops/:id/{approve,reject}`, `GET /api/admin/users`, `POST …/users/:id/{suspend,reinstate}`, `GET /api/admin/analytics` |
| notifications | any authed | already extracted: `controllers/notifications.js` + `repositories/notifications.js` (use as the reference pattern) |

---

## 8. Authorization matrix (enforce in middleware + service)

| Role | May access |
| --- | --- |
| `student` | Own profile, carts, orders, ratings, notifications |
| `shop_owner` | Only shops linked to their verified owner account + that shop's menu/orders/earnings |
| `rider` | Eligible offers, own assigned deliveries, own earnings |
| `admin` | Admin actions via explicitly granted privileges |

Suspended / unverified / pending accounts follow policy-specific restrictions. **A role check is never enough for resource routes** — always verify ownership of the specific resource in the service/repository filter (e.g. `{ _id, ownerUserId: actor.id }`).

---

## 9. Migrating legacy routes (incremental, safe)

For each legacy route that contains inline logic:

1. Identify the endpoint; **do not change its URL, method, or response shape** unless asked.
2. Extract DB calls → `repositories/<resource>.js`.
3. Extract rules → `services/<resource>.js` (keep financial invariants intact; do not duplicate transaction rules in controllers).
4. Create `controllers/<resource>.js` handler.
5. Replace the route callback with: middleware chain → controller.
6. Add/adjust a test proving behavior is unchanged.
7. Commit per route/resource.

Reference implementation: **notifications** (route → controller → repository).

---

## 10. Testing expectations

- **Service unit tests** (no HTTP): pricing, status transitions, cancellation policy, escrow split & rounding, QR eligibility, ownership helpers.
- **Integration (Supertest):** 401 unauthenticated, 403 wrong role, 403/404 wrong owner, server-side price recomputation, concurrent rider claims, duplicate webhooks (idempotency), QR expiry/reuse.
- **Frontend:** hooks with mocked services; E2E (Playwright) for student/owner/rider/admin journeys.
- Use a **separate disposable database** for Mongo concurrency tests.
- Quality gate: lint + prettier pass, build passes, no secrets committed.

---

## 11. Security quick checklist (apply to every new endpoint)

- [ ] `requireSession` + `requireRole` present
- [ ] Zod validation on params/query/body (`.strict()` on bodies)
- [ ] Ownership enforced in service/repository filter
- [ ] Response goes through a serializer/DTO
- [ ] Idempotency key for payments/refunds/non-repeatable actions
- [ ] Rate limit on login, payment, verification, abuse-prone routes
- [ ] No secrets, tokens, or payment data in logs
- [ ] CORS limited to known origins; Helmet enabled
- [ ] Audit log for admin/payment/escrow actions

---

## 12. Copilot prompt recipes

Use these in Copilot Chat (Agent mode) with `#file:mvc.md` attached.

**New backend resource**
> Following `mvc.md` §4 and §7, implement the `<resource>` feature in `backend/src`: validator, repository, service, controller, route, and mount it in `app.js`. JavaScript only. Enforce role + ownership. Return the standard envelope. Add service unit tests.

**Migrate a legacy route**
> Following `mvc.md` §9, refactor `<METHOD> <path>` in `backend/src/routes/<file>.js` into controller → service → repository without changing its URL or response shape. Do not touch unrelated routes.

**New frontend feature**
> Following `mvc.md` §6, create the `<feature>` UI: `services/<feature>-service.js` (with mock), TanStack Query hooks in `features/<feature>/hooks`, presentational components, and the page. Handle loading/empty/error/success/disabled. No business logic in components.

**Audit the project**
> Scan the repo against `mvc.md` §0 and §2. List every violation (logic in routes/controllers/components, DB calls outside repositories, missing validation/authorization) with file paths. Do not change code yet.

---

## 13. Definition of done (per feature)

- Layers separated exactly as in §2; no upward imports.
- Controllers ≤ ~15 lines each; no business logic.
- Standard response envelope and status codes (200/201/204/400/401/403/404/409/422/429/500).
- Tests cover happy path + unauthorized + cross-role + wrong-owner.
- Frontend uses services + hooks; mock is switchable and off in production.
- Docs (`docs/api/README.md`, Postman collection) updated.
