# CampusEats --- Architecture and Technical Design

**Architecture style:** MVC (Model--View--Controller), with service and
repository modules for business logic and data access\
**Frontend:** Next.js App Router, JavaScript\
**Backend plan:** Separate Express.js API, JavaScript\
**Database:** MongoDB with Mongoose for application collections; Better
Auth MongoDB adapter for authentication/session persistence\
**Authentication:** Better Auth sessions; no custom JWT authentication
system\
**Product strategy:** Frontend first, API/backend implemented later

------------------------------------------------------------------------

## 1. Architecture goals

1.  Use JavaScript throughout. Do not generate TypeScript files.
2.  Keep the frontend, authentication configuration, API contract, and
    backend business logic separated.
3.  Use MVC in the Express backend: models represent persisted data,
    controllers handle HTTP requests/responses, and services implement
    business rules.
4.  Keep business logic out of React components and Express controllers.
5.  Make the frontend usable with mock data before the backend is
    available.
6.  Use MongoDB as the persistent application database.
7.  Use Better Auth to validate sessions and persist them in MongoDB. Do
    not introduce custom JWT access/refresh tokens.
8.  Enforce role and resource authorization on trusted server code;
    `proxy.js` is an early route guard, not the only security control.
9.  Treat payments, escrow, order status, prices, QR verification, and
    earnings as server-authoritative.
10. Design for tests, observability, accessibility, and incremental
    deployment.

------------------------------------------------------------------------

## 2. Complete technology stack

### Frontend

-   **Next.js App Router** --- routing, layouts, server components,
    route handlers where appropriate, metadata, and `proxy.js`.
-   **React** --- interactive user interfaces.
-   **JavaScript (ES modules)** --- no TypeScript.
-   **HeroUI** --- accessible interface components. Verify the installed
    major version's API; do not mix HeroUI v2 and v3 examples.
-   **Tailwind CSS** --- responsive styling, theme tokens, and utility
    classes.
-   **Lucide React** --- icons.
-   **Motion for React (`motion`)** --- micro-interactions, transitions,
    drawer motion, and restrained card animations.
-   **Recharts** --- owner, rider, and admin analytics charts.
-   **next-themes** --- light/dark/system theme behavior.
-   **TanStack Query** --- remote data caching, refetching, mutations,
    and pagination.
-   **React Hook Form + Zod + `@hookform/resolvers`** --- form state and
    client-side validation.
-   **Sonner** --- toast notifications.
-   **`clsx` + `tailwind-merge`** --- conditional CSS class handling.
-   **Native responsive layout and an accessible drawer pattern** ---
    navigation drawer, filters drawer, and mobile dashboard sidebar. Use
    HeroUI's supported component or a compatible accessible primitive;
    verify API compatibility before installing an additional drawer
    library.

### Authentication and data

-   **Better Auth** --- registration, sign-in, session management, and
    session validation.
-   **`@better-auth/mongo-adapter`** --- MongoDB persistence adapter
    supported by the installed Better Auth version.
-   **MongoDB Node.js driver** --- shared connection for Better Auth and
    any native database access that is explicitly required.
-   **Mongoose** --- planned backend application models, schema
    validation, indexes, and relationships via ObjectId references.
-   **`proxy.js`** --- early navigation checks for role-specific route
    groups.
-   **Session helper functions** --- server-side session lookup and
    role/resource checks.

### Planned backend

-   **Node.js + Express.js** --- separate HTTP API service.
-   **JavaScript** --- no TypeScript.
-   **Mongoose** --- application model schemas.
-   **Zod** --- request/input validation; duplicate critical validation
    on the server.
-   **Redis** --- cache, short-lived coordination state, rider
    availability or job scheduling when justified.
-   **Socket.IO** --- live order status and rider updates.
-   **BullMQ** --- optional Redis-backed jobs for shop response timeout
    and other scheduled/retryable work.
-   **Winston or Pino** --- structured server logs.
-   **Helmet, CORS configuration, rate limiting, and input
    sanitization** --- API security controls.
-   **Swagger/OpenAPI** --- API documentation.
-   **Jest + Supertest** --- backend unit/integration tests.
-   **Playwright + React Testing Library** --- end-to-end and UI tests.

### Planned integrations

-   **bKash Payment Gateway sandbox** --- payment provider adapter; do
    not fake success or store payment credentials.
-   **Cloudinary** --- image uploads for shops and menu items.
-   **Firebase Cloud Messaging** --- push notifications if required.
-   **Resend or Nodemailer** --- email delivery if required.
-   **OpenStreetMap with a compatible map library** --- map display when
    location data and a suitable client integration are implemented.
-   **QR generation/scanning libraries** --- only for the
    presentation/scanning layer; token validation remains server-side.

### Developer workflow and deployment

-   **npm** initially; consider workspaces/monorepo only when the API
    becomes a separate application.
-   **ESLint + Prettier** --- linting and formatting.
-   **GitHub Actions** --- CI.
-   **Vercel** --- Next.js frontend deployment.
-   **Render/Railway or equivalent** --- Express API deployment.
-   **MongoDB Atlas** --- managed MongoDB.
-   **Managed Redis/Upstash** --- Redis when introduced.

Package versions must be chosen from compatible stable releases when
implementation begins and recorded in `package-lock.json`. Avoid blindly
copying stale version numbers from tutorials.

------------------------------------------------------------------------

## 3. System context

``` mermaid
flowchart TB
    U[Student / Shop Owner / Rider / Admin]
    W[Next.js Frontend]
    P[proxy.js Early Route Guard]
    A[Better Auth Session API]
    DB[(MongoDB Atlas)]
    API[Express API]
    C[Controllers]
    S[Business Services]
    M[Mongoose Models]
    R[(Redis - optional)]
    RT[Socket.IO - optional]
    PAY[bKash Adapter]
    IMG[Cloudinary]
    NOTIF[Email / Push Notifications]

    U --> W
    W --> P
    W --> A
    A --> DB
    W --> API
    API --> C
    C --> S
    S --> M
    M --> DB
    S --> R
    S --> RT
    S --> PAY
    S --> IMG
    S --> NOTIF
```

### Request flow

1.  User interacts with a Next.js page.
2.  The page calls a frontend service function. It does not access
    MongoDB directly from the browser.
3.  The frontend service calls a backend endpoint or, during
    frontend-only development, a mock implementation.
4.  The backend authenticates the session and authorizes the role and
    resource.
5.  The controller validates the request and invokes a service.
6.  The service applies the business rule and uses models/repositories
    to access MongoDB.
7.  The controller returns a consistent response.
8.  TanStack Query updates the UI cache and the interface presents
    success or error feedback.

------------------------------------------------------------------------

## 4. MVC responsibilities

### Model

Models represent persisted application data and its constraints.

Responsibilities: - Define Mongoose schemas and indexes. - Validate data
types and schema-level constraints. - Represent references between
users, shops, menu items, orders, wallets, and other application
entities. - Avoid embedding HTTP request/response behavior into model
definitions. - Avoid treating schema validation as a substitute for
business authorization.

Examples: - `UserProfile` - `Shop` - `MenuItem` - `Order` - `Wallet` -
`EscrowLedgerEntry` - `QRToken` - `Rating` - `Notification` -
`ShopApplication` - `Dispute`

Better Auth owns its own user/session/account/verification persistence
contract. Do not casually duplicate or alter Better Auth's internal
collection schema. Confirm the exact collection names and schema
behavior for the installed adapter version.

### View

The View is the frontend rendered by Next.js and React.

Responsibilities: - Render data and role-specific actions. - Collect
input and display validation feedback. - Show loading, empty, error,
success, and disabled states. - Use shared UI components and consistent
design tokens. - Never authorize sensitive actions solely by hiding
buttons. - Never hold database credentials or privileged secrets.

### Controller

Express controllers translate HTTP requests into application service
calls and format HTTP responses.

Responsibilities: - Read validated parameters, query, and body values. -
Receive authenticated user/session context from trusted middleware. -
Invoke services. - Return appropriate status codes and a consistent
response envelope. - Avoid implementing payment, cancellation, escrow,
or order-transition business rules inline.

### Service

Services hold business use cases and coordinate models/integrations.

Examples: - `AuthzService` - `ShopService` - `MenuService` -
`OrderService` - `PaymentService` - `EscrowService` -
`QRVerificationService` - `RiderAssignmentService` -
`CancellationPolicyService` - `RatingService` - `NotificationService` -
`DisputeService` - `AnalyticsService`

Services should be testable without an HTTP request object.

### Repository (supporting layer)

Repositories centralize common database queries when this meaningfully
simplifies services. Small projects do not need a repository wrapper for
every simple query, but complex or security-sensitive queries should be
centralized and tested.

### Middleware

Middleware handles cross-cutting HTTP concerns: - Session
authentication - Role/resource authorization - Request validation - Rate
limiting - CORS and security headers - Request IDs and structured
logging - Error handling

------------------------------------------------------------------------

## 5. Suggested repository structure

This structure can begin as a single Next.js app for Phase 1. When the
backend is started, evolve it into the following workspace. Do not
create empty modules solely to match a diagram.

``` text
campuseats/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/
│   │   │   │   │   └── page.js
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.js
│   │   │   │   │   ├── register/page.js
│   │   │   │   │   └── forgot-password/page.js
│   │   │   │   ├── (student)/
│   │   │   │   │   ├── layout.js
│   │   │   │   │   ├── student/home/page.js
│   │   │   │   │   ├── search/page.js
│   │   │   │   │   ├── shops/[shopId]/page.js
│   │   │   │   │   ├── cart/page.js
│   │   │   │   │   ├── orders/page.js
│   │   │   │   │   └── orders/[orderId]/page.js
│   │   │   │   ├── (shop-owner)/
│   │   │   │   │   ├── layout.js
│   │   │   │   │   ├── shop-owner/dashboard/page.js
│   │   │   │   │   ├── menu/page.js
│   │   │   │   │   ├── orders/page.js
│   │   │   │   │   └── earnings/page.js
│   │   │   │   ├── (rider)/
│   │   │   │   │   ├── layout.js
│   │   │   │   │   ├── rider/available-orders/page.js
│   │   │   │   │   ├── rider/active-delivery/page.js
│   │   │   │   │   └── rider/earnings/page.js
│   │   │   │   ├── (admin)/
│   │   │   │   │   ├── layout.js
│   │   │   │   │   ├── admin/dashboard/page.js
│   │   │   │   │   ├── admin/shops/page.js
│   │   │   │   │   ├── admin/users/page.js
│   │   │   │   │   └── admin/disputes/page.js
│   │   │   │   ├── api/auth/[...all]/route.js
│   │   │   │   ├── layout.js
│   │   │   │   ├── providers.js
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── shared/
│   │   │   │   ├── layouts/
│   │   │   │   └── features/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── shops/
│   │   │   │   ├── menu/
│   │   │   │   ├── cart/
│   │   │   │   ├── orders/
│   │   │   │   ├── owner/
│   │   │   │   ├── rider/
│   │   │   │   └── admin/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   │   ├── api-client.js
│   │   │   │   ├── shop-service.js
│   │   │   │   ├── order-service.js
│   │   │   │   └── mock/
│   │   │   ├── lib/
│   │   │   │   ├── auth.js
│   │   │   │   ├── auth-client.js
│   │   │   │   ├── session.js
│   │   │   │   ├── mongodb.js
│   │   │   │   └── utils.js
│   │   │   ├── proxy.js
│   │   │   └── types/ # optional runtime-independent JSDoc typedefs; no TS files
│   │   ├── .env.example
│   │   ├── next.config.mjs
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   │   ├── env.js
│       │   │   └── database.js
│       │   ├── models/
│       │   │   ├── Shop.js
│       │   │   ├── MenuItem.js
│       │   │   ├── Order.js
│       │   │   ├── Wallet.js
│       │   │   ├── EscrowLedgerEntry.js
│       │   │   ├── QRToken.js
│       │   │   ├── Rating.js
│       │   │   ├── Notification.js
│       │   │   ├── ShopApplication.js
│       │   │   └── Dispute.js
│       │   ├── controllers/
│       │   │   ├── shop-controller.js
│       │   │   ├── menu-controller.js
│       │   │   ├── order-controller.js
│       │   │   ├── rider-controller.js
│       │   │   ├── payment-controller.js
│       │   │   └── admin-controller.js
│       │   ├── services/
│       │   │   ├── shop-service.js
│       │   │   ├── menu-service.js
│       │   │   ├── order-service.js
│       │   │   ├── rider-assignment-service.js
│       │   │   ├── payment-service.js
│       │   │   ├── escrow-service.js
│       │   │   ├── qr-verification-service.js
│       │   │   └── cancellation-policy-service.js
│       │   ├── repositories/
│       │   ├── routes/
│       │   ├── middleware/
│       │   │   ├── require-session.js
│       │   │   ├── require-role.js
│       │   │   ├── validate-request.js
│       │   │   ├── rate-limit.js
│       │   │   └── error-handler.js
│       │   ├── integrations/
│       │   │   ├── bkash/
│       │   │   ├── cloudinary/
│       │   │   ├── notifications/
│       │   │   └── realtime/
│       │   ├── app.js
│       │   └── server.js
│       ├── tests/
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── schemas/
│       ├── constants/
│       └── package.json
├── docs/
│   ├── plan.md
│   └── architecture.md
├── .gitignore
├── package.json
└── README.md
```

**Routing note:** Parenthesized folders in Next.js are route groups and
do not appear in the URL. Ensure actual URL paths match the chosen route
structure. For example, a route group named `(student)` does not create
`/student` by itself; include a `student/` segment if `/student/...` is
the intended URL.

------------------------------------------------------------------------

## 6. Authentication and authorization design

### Better Auth session flow

1.  User signs in through Better Auth.
2.  Better Auth creates/persists a session using its supported MongoDB
    adapter.
3.  Browser receives the authentication cookie according to Better
    Auth's configuration.
4.  Server code uses Better Auth's session API to validate the request.
5.  `proxy.js` can redirect unauthenticated requests away from
    role-specific areas.
6.  Protected pages, route handlers, and Express API operations perform
    their own trusted authorization checks.
7.  Logout invalidates the session through Better Auth.

### Do not do these things

-   Do not create custom JWT access and refresh tokens.
-   Do not store session tokens in `localStorage`.
-   Do not expose MongoDB URI, Better Auth secret, or payment secrets to
    client code.
-   Do not trust a role supplied by a registration form, query string,
    request body, or local storage.
-   Do not assume a cookie is valid just because it exists.
-   Do not rely on `proxy.js` as the only authorization boundary.
-   Do not return private data and rely on the frontend to hide it.

### Role and resource authorization

-   `student`: access only their own profile, addresses, carts, orders,
    ratings, and notifications.
-   `shop_owner`: access only shops explicitly linked to their verified
    owner account, and the associated menu/orders/earnings.
-   `rider`: access eligible delivery offers and their assigned
    deliveries and earnings.
-   `admin`: access administrative actions only through explicitly
    granted privileges.
-   Suspended, unverified, or pending accounts are subject to
    policy-specific restrictions.

A role check is not always sufficient. For example, a shop owner role
does not authorize editing every shop; the backend must verify ownership
of the specific shop resource.

------------------------------------------------------------------------

## 7. MongoDB collection plan

Collection names and fields below are the proposed application data
model. Better Auth's internal collections must follow the adapter's own
schema and migration/creation behavior.

### 7.1 Authentication collections managed by Better Auth

Expected conceptual records include: - User - Session - Account -
Verification

Do not assume exact physical collection names without checking the
installed Better Auth MongoDB adapter version. Do not manually create
competing authentication collections without a clear migration plan.

### 7.2 Application collections

#### `userProfiles` (or a carefully extended Better Auth user model)

Fields: - `userId` --- unique reference to the Better Auth user -
`displayName` - `phone` - `studentId` - `role` --- student, shop_owner,
rider, admin - `profilePhotoUrl` - `dormitoryAddress` or a separate
address collection - `verificationStatus` - `isSuspended` - `createdAt`,
`updatedAt`

Design choice: keep authentication identity owned by Better Auth. Put
application-only profile data in a separate collection unless the
selected Better Auth schema extension is deliberately used and
validated.

#### `shops`

-   `ownerUserId`
-   `name`
-   `slug`
-   `description`
-   `campusLocation` (GeoJSON Point if location-based queries are
    needed)
-   `operatingHours`
-   `isOpen`
-   `approvalStatus`
-   `averageRating`
-   `bannerUrl`
-   `createdAt`, `updatedAt`

Indexes: owner reference, slug uniqueness, approval/open status, and a
`2dsphere` index for GeoJSON location queries.

#### `menuItems`

-   `shopId`
-   `name`
-   `description`
-   `category`
-   `price`
-   `photoUrl`
-   `isAvailable`
-   `preparationTimeMinutes`
-   `createdAt`, `updatedAt`

Indexes: `shopId`, category/availability, and text search fields if
using MongoDB text search.

#### `orders`

-   `customerUserId`
-   `shopId`
-   `riderUserId` (nullable until assigned)
-   `items[]` with `menuItemId`, item-name snapshot, quantity, and
    `priceAtOrder`
-   `status`
-   `deliveryAddressSnapshot`
-   `deliveryNote`
-   `subtotal`
-   `deliveryFee`
-   `total`
-   `currency`
-   `paymentStatus`
-   `escrowStatus`
-   `statusTimestamps`
-   `createdAt`, `updatedAt`

Indexes: customer and creation date, shop and status, rider and status,
and operational queue fields. Use explicit allowed status transitions in
the service layer.

#### `payments`

-   `orderId`
-   `provider`
-   `providerReference`
-   `amount`
-   `currency`
-   `status`
-   `idempotencyKey`
-   `confirmedAt`
-   `createdAt`, `updatedAt`

Do not store raw payment credentials. Validate provider
callbacks/webhooks.

#### `wallets`

-   `userId`
-   `balance` (or a derived balance backed by a ledger)
-   `currency`
-   `updatedAt`

Use a single currency definition per record and avoid floating-point
money arithmetic. Use integer minor units or a documented decimal
representation.

#### `escrowLedger`

-   `orderId`
-   `amount`
-   `currency`
-   `debitAccount`
-   `creditAccount`
-   `eventType`: lock, release, refund, adjustment if approved
-   `idempotencyKey`
-   `metadata`
-   `createdAt`

Append-only. Do not update or delete historical ledger entries as a way
to correct mistakes; create a compensating entry with an audit trail.
Use MongoDB transactions for multi-document money movement when the
deployment topology supports transactions.

#### `qrTokens`

-   `orderId`
-   `userId`
-   `purpose`: pickup or delivery
-   `tokenHash` or other safe verification representation
-   `expiresAt`
-   `usedAt`
-   `createdAt`

Index order/user/purpose and expiration fields. The server must validate
expiry, authorized participant, order state, and single-use status
atomically.

#### `ratings`

-   `orderId`
-   `customerUserId`
-   `shopRating`
-   `riderRating`
-   `reviewText`
-   `createdAt`, `updatedAt`

Add a uniqueness constraint for the intended one-rating-per-order
policy.

#### `notifications`

-   `userId`
-   `title`
-   `body`
-   `type`
-   `isRead`
-   `deepLink`
-   `createdAt`

Indexes: user and creation date, user and unread state.

#### `shopApplications`

-   `ownerUserId`
-   `shopDetails`
-   `documents`
-   `status`: pending, approved, rejected
-   `reviewedBy`
-   `reviewReason`
-   `submittedAt`, `reviewedAt`

#### `riderProfiles`

-   `userId`
-   `eligibilityData`
-   `verificationStatus`
-   `availability`
-   `createdAt`, `updatedAt`

#### `disputes`

-   `orderId`
-   `openedByUserId`
-   `reason`
-   `evidence`
-   `status`
-   `assignedAdminUserId`
-   `resolution`
-   `resolvedAt`
-   `createdAt`, `updatedAt`

#### Optional `auditLogs`

-   `actorUserId`
-   `action`
-   `resourceType`
-   `resourceId`
-   `requestId`
-   `safeMetadata`
-   `createdAt`

Never log secrets, raw session tokens, passwords, or payment
credentials.

------------------------------------------------------------------------

## 8. API response contract

Use a consistent response shape where practical:

``` json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Example error:

``` json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  },
  "meta": {}
}
```

Suggested HTTP status conventions: - `200` --- successful read/update -
`201` --- resource created - `204` --- successful operation without a
response body - `400` --- malformed request - `401` ---
unauthenticated - `403` --- authenticated but unauthorized - `404` ---
resource not found or deliberately concealed - `409` --- conflicting
state, duplicate claim, or idempotency conflict - `422` --- valid JSON
but invalid business input - `429` --- rate limited - `500` ---
unexpected server failure

Never return stack traces or internal secrets to clients.

------------------------------------------------------------------------

## 9. Suggested API route groups

These are proposed endpoints, not implemented endpoints.

### Shops and menus

-   `GET /api/shops`
-   `GET /api/shops/:shopId`
-   `GET /api/shops/:shopId/menu`
-   `POST /api/owner/shops`
-   `PATCH /api/owner/shops/:shopId`
-   `POST /api/owner/shops/:shopId/menu`
-   `PATCH /api/owner/menu-items/:menuItemId`
-   `DELETE /api/owner/menu-items/:menuItemId`

### Orders

-   `POST /api/orders`
-   `GET /api/orders`
-   `GET /api/orders/:orderId`
-   `POST /api/orders/:orderId/cancel`
-   `POST /api/owner/orders/:orderId/accept`
-   `POST /api/owner/orders/:orderId/reject`
-   `POST /api/owner/orders/:orderId/ready`

### Rider

-   `GET /api/rider/offers`
-   `POST /api/rider/orders/:orderId/claim`
-   `GET /api/rider/active-delivery`
-   `POST /api/rider/orders/:orderId/verify-pickup`
-   `POST /api/rider/orders/:orderId/verify-delivery`
-   `GET /api/rider/earnings`

### Payment and disputes

-   `POST /api/payments/checkout`
-   `POST /api/payments/webhook`
-   `GET /api/wallet`
-   `GET /api/transactions`
-   `POST /api/orders/:orderId/disputes`
-   `GET /api/admin/disputes`
-   `POST /api/admin/disputes/:disputeId/resolve`

### Admin

-   `GET /api/admin/shops/applications`
-   `POST /api/admin/shops/:shopId/approve`
-   `POST /api/admin/shops/:shopId/reject`
-   `GET /api/admin/users`
-   `POST /api/admin/users/:userId/suspend`
-   `POST /api/admin/users/:userId/reinstate`
-   `GET /api/admin/analytics`

The final API contract should be documented with OpenAPI and tested
before frontend integration.

------------------------------------------------------------------------

## 10. Frontend architecture and data loading

### Feature-based UI

Organize UI around features: - `features/auth` - `features/shops` -
`features/menu` - `features/cart` - `features/orders` -
`features/owner` - `features/rider` - `features/admin`

Shared elements belong in `components/shared` or `components/ui`. Avoid
putting all page logic in one giant component.

### Service boundary

Pages/components should call service functions, for example: -
`shopService.listShops(filters)` - `shopService.getShop(shopId)` -
`menuService.listMenuItems(shopId, filters)` -
`orderService.createOrder(input)` - `orderService.getOrder(orderId)`

During frontend-only development, service functions may call mock
implementations. Later, replace the implementation with API calls
without rewriting the page layout. Do not let mock data accidentally
become a production fallback.

### TanStack Query

-   Use stable query keys that include relevant filters and IDs.
-   Use pagination/infinite queries for long lists.
-   Use optimistic updates only where rollback and conflict handling are
    defined.
-   Invalidate related queries after mutations.
-   Avoid caching private user data in a shared server cache.
-   Handle stale data, loading, empty results, retry, and authorization
    errors.

### Lazy loading

Use Next.js dynamic imports for heavy client-only modules such as QR
scanning, complex charts, and maps where appropriate. Use server-side
pagination and query-driven loading for long lists. Lazy loading must
not delay critical authentication or authorization checks.

### State ownership

-   Server data: TanStack Query.
-   Temporary UI state: local React state.
-   Cart state: a dedicated store/context only if required; validate all
    prices and stock with the server at checkout.
-   Theme state: `next-themes`.
-   Session state: Better Auth client/server session APIs.
-   Never treat client state as authoritative for roles, balances,
    payment state, or order transitions.

------------------------------------------------------------------------

## 11. Order lifecycle and financial correctness

### Proposed order lifecycle

`placed → confirmed → awaiting_rider → claimed/assigned → picked_up/in_transit → delivered`

Alternative terminal paths: - `cancelled` - `rejected` - `disputed`

Choose one canonical status vocabulary before coding. Do not use
`claimed`, `assigned`, `picked_up`, and `in_transit` inconsistently
across the UI and database.

### Atomic rider claim

Use an atomic database operation that matches an eligible, unclaimed
order and assigns the rider in the same operation. If no document
matches, report a conflict and refresh the rider feed.

### Escrow

1.  Recalculate the order total server-side.
2.  Initiate provider payment.
3.  Confirm payment through the trusted provider result/webhook.
4.  Record the escrow lock idempotently.
5.  After authorized delivery confirmation, calculate and record the
    approved split in a transaction.
6.  On eligible cancellation/refund, record the appropriate compensating
    ledger event and provider refund result.
7.  Reconcile provider records and internal ledger regularly.

The proposed split of 85% shop / 12% rider / 3% platform and
cancellation percentages are product rules requiring approval. They must
be represented as explicit, tested configuration/policy, not scattered
frontend constants.

### QR handover

-   Generate purpose-specific tokens on the server.
-   Bind each token to an order and authorized user.
-   Apply expiry and single-use checks atomically.
-   Verify the current order state before accepting a token.
-   Never mark a handover complete based solely on a successful camera
    scan.
-   Do not put reusable secrets in logs or analytics.

### MongoDB transactions

Transactions require a deployment configuration that supports them.
Confirm Atlas cluster topology and transaction behavior before
implementing escrow. Make operations idempotent and add
reconciliation/recovery procedures for provider/network failures.

------------------------------------------------------------------------

## 12. Security checklist

-   Validate Better Auth configuration and trusted origins.
-   Use HTTPS in production.
-   Keep `BETTER_AUTH_SECRET`, MongoDB URI, payment secrets, and
    provider credentials server-only.
-   Use secure cookie/session settings supported by Better Auth and the
    deployment environment.
-   Verify the session on protected server routes and API operations.
-   Apply role and resource authorization to every protected action.
-   Rate-limit login, verification, payment, and other abuse-prone
    endpoints.
-   Validate all request bodies, query parameters, and path IDs.
-   Sanitize/validate database input; avoid unsafe dynamic query
    construction.
-   Restrict CORS to known origins.
-   Apply Helmet/security headers to the Express API.
-   Do not store passwords or payment credentials in application logs.
-   Use idempotency keys for payment, refunds, and other non-repeatable
    operations.
-   Audit admin, payment, escrow, and sensitive account actions.
-   Apply upload type/size limits and authorize media changes.
-   Do not rely on frontend validation for security.
-   Review dependency advisories and keep the lockfile current.

------------------------------------------------------------------------

## 13. Testing strategy

### Unit tests

-   Cancellation policy
-   Order transition rules
-   Pricing/fee calculation
-   Escrow split and rounding
-   QR token eligibility
-   Permission and resource-ownership helpers

### Integration tests

-   Registration/sign-in/session lifecycle
-   Unauthorized and cross-role requests
-   Shop approval and owner access
-   Menu CRUD ownership checks
-   Order creation with server-side price recalculation
-   Concurrent rider claims
-   Duplicate payment webhooks and idempotency
-   Escrow lock/release/refund transaction behavior
-   QR expiry and reuse rejection

### Frontend and end-to-end tests

-   Login and logout
-   Role-specific navigation and redirect
-   Student browse → shop → cart → checkout journey
-   Owner menu creation and order processing
-   Rider claim → pickup → delivery flow
-   Admin approval and dispute resolution
-   Mobile drawer, theme toggle, keyboard access, form validation
-   Loading, empty, error, and offline states

### Quality gates

-   Lint and formatting pass.
-   Production build succeeds.
-   No secrets committed.
-   Critical API paths covered by tests.
-   Accessibility checks and keyboard review completed.
-   Responsive review at 320px, 768px, and 1440px.
-   Logs, monitoring, backups, and rollback plan documented before
    launch.

------------------------------------------------------------------------

## 14. Environment variable policy

Frontend `.env.example` may include placeholders such as: -
`BETTER_AUTH_URL` - `BETTER_AUTH_SECRET` - `MONGODB_URI` -
`MONGODB_DB` - `NEXT_PUBLIC_API_BASE_URL` (only if browser requests
target the separate API)

Backend `.env.example` may include: - `PORT` - `MONGODB_URI` -
`MONGODB_DB` - `BETTER_AUTH_URL` or the configured trusted
session-verification settings - `REDIS_URL` when Redis is introduced -
Payment provider sandbox credentials - Cloudinary credentials -
Notification provider credentials - Allowed frontend origin(s)

Only variables explicitly prefixed with `NEXT_PUBLIC_` are intended for
browser exposure. Never put secrets behind that prefix. Use a runtime
environment schema and fail fast when required variables are missing.

------------------------------------------------------------------------

## 15. Lovable / Figma Make build instruction

Use the following as the product-level prompt when generating the first
design or frontend prototype:

> Build CampusEats, a polished, responsive campus food-ordering and
> student-delivery platform. Use JavaScript, Next.js App Router
> conventions, HeroUI, Tailwind CSS, Lucide React, Motion for React,
> Recharts, and a light/dark theme system. The intended authentication
> system is Better Auth with MongoDB-backed sessions, not a custom JWT
> system. The future backend will use Express.js and MongoDB/Mongoose
> with MVC architecture.
>
> Create distinct layouts and navigation for students/customers, shop
> owners, delivery riders, and administrators. Use a calm, modern visual
> system with warm off-white and soft sage backgrounds, restrained
> gradients, glass-like cards, rounded corners, subtle shadows, small
> hover scale/lift effects, and accessible transitions. Make all screens
> responsive from 320px mobile to desktop. Provide keyboard focus,
> readable contrast, reduced-motion support, and complete loading,
> empty, error, disabled, and success states.
>
> Design the public landing page and onboarding, authentication screens
> with password visibility toggle, theme toggle, student
> discovery/search/filter/shop/menu/cart/checkout/order
> tracking/history/profile, owner dashboard/menu/orders/earnings, rider
> available orders/active delivery/QR verification/earnings, and admin
> dashboard/shop approvals/user management/disputes.
>
> Use realistic mock data through separate service functions and data
> contracts; do not pretend that payments, QR verification,
> authorization, or live tracking are functional until connected to the
> backend. Design around MongoDB entities: Better Auth user/session
> records, user profiles, shops, menu items, orders, payments, wallets,
> escrow ledger, QR tokens, ratings, notifications, shop applications,
> rider profiles, and disputes.
>
> Enforce role-aware navigation in the interface, but document that
> security must be enforced on the server. `proxy.js` is only an early
> route guard. Keep components reusable, pages feature-based, data
> fetching lazy/paginated where useful, and dashboard charts in
> Recharts. Do not use TypeScript. Do not invent admin accounts, real
> testimonials, live business metrics, or successful payment states.

------------------------------------------------------------------------

## 16. Decisions to confirm before implementation

1.  Whether students and riders use the same base role (`student`) with
    rider eligibility as a separate profile, or whether `rider` is a
    separate authorization role. The UI can distinguish these
    experiences, but the permission model must be consistent.
2.  Whether login is email/password, phone/password, or phone OTP.
    Better Auth capabilities and any OTP plugin/provider must be
    verified before promising a flow.
3.  Whether carts may contain items from multiple shops. A
    one-shop-per-cart first release is simpler and safer.
4.  Whether payment is required at launch and which bKash
    sandbox/production integration path is approved.
5.  Whether the proposed escrow split, cancellation percentages,
    timeout, and strike rules are final.
6.  Whether delivery distance and live rider map tracking are required
    for the first release.
7.  Whether shop documents and rider eligibility information require
    manual admin review.

Do not block initial visual design on all decisions. Mark undecided
behavior clearly and keep it configurable until product requirements are
approved.
