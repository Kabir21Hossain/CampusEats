# CampusEats --- Product Plan and User Stories

**Document purpose:** Product requirements and implementation plan for
designing CampusEats in Figma Make or building the interface in Lovable,
then implementing it as a production-ready application.

**Project name:** CampusEats\
**Product type:** Campus-based food ordering and peer-to-peer delivery
platform\
**Primary users:** Students/customers, shop owners, delivery riders,
administrators\
**Currency:** BDT (৳)\
**Initial build strategy:** Frontend first using mock data and service
interfaces; implement and connect the real backend in a later phase.\
**Language requirement:** JavaScript only. Do not use TypeScript.

------------------------------------------------------------------------

## 1. Product vision

CampusEats connects students who want food delivered to their dormitory
or campus location with approved campus food shops and student delivery
riders. Students can discover shops, search and filter menus, order
food, follow order progress, and confirm handovers. Shop owners manage
menus and incoming orders. Riders claim deliveries and earn money.
Administrators approve shops, oversee users, and resolve disputes.

The application must feel like a polished product from a funded startup:
friendly, calm, trustworthy, fast, accessible, responsive, and
consistent across all roles.

### Product principles

1.  **Role-specific experiences:** Students, shop owners, riders, and
    admins have different navigation, dashboards, and permitted actions.
2.  **Frontend first:** Build complete screens with realistic mock data
    before integrating business APIs.
3.  **Session-based authentication:** Use Better Auth and MongoDB-backed
    sessions. Do not implement a custom JWT access/refresh-token
    authentication system. `session.token` is a session credential, not
    a reason to expose tokens to browser code.
4.  **Server-enforced authorization:** `proxy.js` can provide early
    route redirects, but protected server pages and backend endpoints
    must independently validate the session and role.
5.  **Reliable ordering and money movement:** Payment, escrow, refunds,
    QR verification, and earnings must be confirmed by the server, never
    by frontend-only state.
6.  **Accessible responsive design:** Support keyboard use, clear focus
    states, readable contrast, reduced motion, and mobile widths from
    320px upward.
7.  **Useful loading states:** Every data-driven screen must support
    loading, success, empty, and error states.
8.  **Build incrementally:** Finish and verify one phase before moving
    to the next.

------------------------------------------------------------------------

## 2. User roles and permissions

### 2.1 Student / Customer

Can: - Register and sign in. - Manage their profile and delivery
addresses. - Browse approved shops and available menu items. - Search
and filter shops and food. - Add items from one shop to a cart at a time
unless multi-shop carts are explicitly implemented later. - Place orders
and select an available payment method. - View current and past
orders. - Track order status. - Present or scan the appropriate QR code
when the server-authorized handover flow requires it. - Rate eligible
completed orders. - Read notifications and manage basic preferences. -
Cancel an order only when the server's cancellation policy permits it. -
Open a dispute when cancellation is no longer allowed.

Cannot: - Change their role through a form or browser storage. - Manage
shops, assign themselves as a rider, alter prices after order placement,
or mark an order delivered themselves. - See another user's private
orders, addresses, payment records, or session data.

### 2.2 Shop Owner

Can: - Register an owner account and submit a shop application. - See
application status and the reason for rejection when applicable. -
Manage approved shop details, operating hours, open/closed state, and
menu items. - Accept or reject incoming orders within the permitted
response window. - Update order preparation status. - Complete the
pickup handover verification flow. - View shop-specific orders,
earnings, ratings, and analytics. - View transaction history and submit
a withdrawal request if the wallet/withdrawal system is enabled.

Cannot: - Approve their own shop. - Access another owner's shop or
earnings. - Edit order price snapshots or create fake payment
confirmations. - Release escrow directly from the browser.

### 2.3 Delivery Rider

Can: - Register as a rider and submit required verification
information. - Set availability when eligible. - View available delivery
offers. - Claim an eligible order; the server must prevent two riders
from claiming the same order. - View the active delivery and delivery
instructions needed to complete it. - Verify pickup and delivery through
the designated QR workflow. - View completed deliveries, earnings, and
relevant notifications.

Cannot: - Claim an already claimed order. - Change order totals, payment
state, or escrow ledger entries. - Confirm a pickup or delivery without
successful server-side verification. - View private customer data
unrelated to assigned deliveries.

### 2.4 Administrator

Can: - View platform-level KPIs and operational activity. - Review,
approve, or reject shop applications with a reason. - Search and filter
users and suspend/reinstate accounts according to policy. - Review
disputes and issue an authorized resolution/refund. - Inspect orders and
audit history. - View platform analytics and operational reports.

Admin access must be provisioned through a trusted process. A public
registration form must never allow someone to choose the admin role.

------------------------------------------------------------------------

## 3. Navigation and layout requirements

### Public layout

-   Marketing landing page with product explanation and clear calls to
    action.
-   Login, registration, and password-recovery screens.
-   Responsive header with CampusEats logo, public navigation, theme
    toggle, and sign-in/get-started actions.
-   Mobile menu opened by a menu button and closed by Escape, close
    button, or navigation.

### Student layout

-   Desktop: sticky top navigation with search, cart count,
    notifications, profile menu, and theme toggle.
-   Mobile: compact header plus bottom navigation for primary
    destinations; use drawers for filters and secondary actions.
-   Main destinations: Home, Search/Explore, Orders, Profile.
-   Cart and order tracking must be reachable without confusing
    navigation.

### Shop-owner layout

-   Desktop: collapsible sidebar with active-route indication, page
    header, notifications, theme toggle, and profile menu.
-   Mobile: sidebar becomes a slide-in drawer; main content must not
    overflow horizontally.
-   Main destinations: Dashboard, Orders, Menu, Earnings, Shop Settings.

### Rider layout

-   Mobile-first delivery workflow with large, clear actions.
-   Destinations: Available Orders, Active Delivery, Earnings, Profile.
-   Show a clear state for offline/unavailable riders and no available
    orders.

### Admin layout

-   Desktop: sidebar and data-dense but readable dashboard.
-   Mobile: collapsible drawer and responsive tables/cards.
-   Destinations: Overview, Shop Approvals, Users, Orders, Disputes,
    Analytics.

### Shared navigation behavior

-   Navigation items are generated from the authenticated role.
-   Active route is visually distinct.
-   Show accessible labels for icon-only controls.
-   Theme toggle supports light, dark, and system preference if
    available.
-   Never treat hidden navigation as the security mechanism; server
    authorization remains mandatory.

------------------------------------------------------------------------

## 4. Design system and visual direction

### Visual identity

-   Warm off-white or very light sage backgrounds.
-   Muted green primary brand color.
-   Soft neutral surfaces, restrained amber accents, and semantic
    success/warning/error colors.
-   Subtle gradients in hero areas and selected highlights, not behind
    every component.
-   Glass-like cards using translucent surfaces and backdrop blur where
    legibility remains strong.
-   Rounded cards, dialogs, inputs, and buttons; consistent radius
    scale.
-   Soft shadows and restrained hover lift/scale.
-   Smooth Motion transitions for route content, menus, drawers, and
    card interactions.
-   Typography should be clean and modern, with a strong display heading
    and readable body text.
-   Light and dark themes must both have appropriate contrast; do not
    merely invert colors.

### Component states

Every interactive component should define: - Default - Hover -
Focus-visible - Pressed/active - Disabled - Loading - Error/invalid,
where relevant

### Responsive checkpoints

-   320px mobile
-   375--430px common mobile
-   768px tablet
-   1024px compact desktop
-   1440px desktop

### Motion and accessibility

-   Respect `prefers-reduced-motion`.
-   Do not animate every element at once.
-   Avoid motion that delays essential actions.
-   Keep keyboard focus visible and focus contained in open modal/drawer
    dialogs.
-   Provide alt text for meaningful images and accessible labels for
    icon buttons.

------------------------------------------------------------------------

## 5. User stories and acceptance criteria

User story format: **As a \[role\], I want \[capability\], so that
\[benefit\].**

### EPIC A --- Public landing and onboarding

#### US-A01: Understand the product

**As a visitor,** I want to understand what CampusEats does, so that I
can decide whether to use it.

Acceptance criteria: - Landing page explains student ordering, shop
management, and campus delivery. - Primary calls to action lead to login
or registration. - Feature sections and footer work at mobile and
desktop widths. - No fake customer testimonials or unsupported trust
claims are presented as real.

#### US-A02: Choose an account path

**As a visitor,** I want to select the role I am applying for, so that I
see the correct registration flow.

Acceptance criteria: - Show Student, Shop Owner, and Rider choices. -
Admin is not a public registration option. - Each choice explains its
purpose and routes to the corresponding form. - The selected role is
treated as an application intent, not trusted authorization.

#### US-A03: Recover access

**As a user,** I want to recover access to my account, so that I am not
permanently locked out after losing credentials.

Acceptance criteria: - Recovery form gives neutral feedback that does
not reveal whether an account exists. - Loading, success, expiry, and
failure states are designed. - Real delivery and token verification are
implemented only in the backend phase.

### EPIC B --- Authentication and profile

#### US-B01: Register as a student

**As a student,** I want to create an account with my identity and
dormitory delivery information, so that I can order food.

Acceptance criteria: - Form captures the required name, student
identifier, phone/contact information, credentials, and delivery address
fields agreed for launch. - Validation errors appear next to relevant
fields. - Password visibility toggle switches between masked and visible
text. - User cannot assign themselves an elevated role by changing
client data. - Verification status is clearly displayed where
verification is required.

#### US-B02: Apply as a shop owner

**As a shop owner,** I want to submit my personal and shop information,
so that the platform can review my shop.

Acceptance criteria: - Form collects shop name, description, location,
operating hours, and required application documents. - The application
has draft, pending, approved, and rejected states. - Pending owners see
a review status screen and cannot process live orders until approved. -
Approval is an admin action, not a frontend toggle.

#### US-B03: Register as a rider

**As a student rider,** I want to submit my profile and required
eligibility information, so that I can be reviewed for deliveries.

Acceptance criteria: - Form collects the required identity/contact and
eligibility fields. - Required terms/consents must be explicitly
accepted. - Verification status is visible. - Unapproved/ineligible
riders cannot claim orders.

#### US-B04: Sign in securely

**As a registered user,** I want to sign in and keep a secure session,
so that I can use the correct dashboard.

Acceptance criteria: - Authentication is implemented with Better Auth
and its MongoDB adapter. - Session is validated server-side. - Do not
create a custom JWT authentication system. - Password visibility control
is accessible. - Show invalid credentials, loading, rate-limit, and
network error states without leaking secrets. - Logout invalidates the
server session and clears client session state.

#### US-B05: Manage my profile

**As an authenticated user,** I want to update permitted profile fields,
so that my account stays current.

Acceptance criteria: - Only editable fields are shown as editable. -
Role and verification state cannot be changed by the user. - Save
success/failure is explicit. - Sensitive fields are never exposed to
other users without a business need.

#### US-B06: Switch theme

**As a user,** I want to toggle light/dark theme, so that I can
comfortably use the app in different environments.

Acceptance criteria: - Toggle is visible in the navbar or user menu. -
Theme choice persists according to the chosen theme provider. - No
significant hydration flash or unreadable color combinations. - Respect
system preference when system mode is selected.

### EPIC C --- Student discovery and menu

#### US-C01: Browse approved shops

**As a student,** I want to browse approved campus shops, so that I can
find places to order from.

Acceptance criteria: - Show shop image/banner, name, rating when
available, open/closed state, and relevant delivery information. - Only
approved shops are listed publicly. - Loading skeletons, empty state,
and error/retry state are implemented. - Cards link to shop detail
pages.

#### US-C02: Search shops and food

**As a student,** I want to search by shop or food name, so that I can
find a specific option quickly.

Acceptance criteria: - Search input has clear and loading states. -
Results distinguish shops from menu items. - Debounce requests by
approximately 300ms when connected to the API. - Empty results show a
useful message and a way to clear search. - Backend search and indexes
are implemented in the backend phase.

#### US-C03: Filter and sort

**As a student,** I want to filter and sort results, so that I can find
food that matches my preferences.

Acceptance criteria: - Filters include category, price range, minimum
rating, and open/closed status where data is available. - Sort options
include rating, price, and distance only when the required data
exists. - Filters can be combined and cleared. - Mobile filters open in
a drawer and show the active filter count. - Results update with loading
feedback.

#### US-C04: View shop and menu

**As a student,** I want to inspect a shop and its menu, so that I can
decide what to order.

Acceptance criteria: - Shop detail includes banner, name, description,
location, opening status, and menu categories. - Menu items show name,
description, price, image, and availability. - Unavailable items cannot
be added to the cart. - Menu lists support lazy loading or pagination
when large.

#### US-C05: Add items to cart

**As a student,** I want to add, remove, and change quantities, so that
I can prepare an order.

Acceptance criteria: - Cart shows item quantities, item price, subtotal,
and estimated fees where available. - Quantity cannot go below one;
removing an item is an explicit action. - Cart behavior across multiple
shops is clearly defined. Initial release should allow one shop per cart
unless cross-shop checkout is deliberately designed. - Display an
empty-cart state. - Frontend totals are estimates; the server
recalculates authoritative prices during checkout.

### EPIC D --- Checkout and order management

#### US-D01: Checkout an order

**As a student,** I want to confirm my items, address, and payment
method, so that I can place an order.

Acceptance criteria: - Show item summary, delivery address, delivery
fee, subtotal, and total. - Validate address and required checkout
fields. - Prevent repeated submission while a request is pending. -
Server rechecks availability, prices, fees, ownership, and order
eligibility. - An order is not shown as paid until the payment
provider/server confirms it.

#### US-D02: View order history

**As a student,** I want to view active and past orders, so that I can
monitor and repeat orders.

Acceptance criteria: - Separate active and completed/cancelled orders. -
Show order reference, shop, date, total, and current status. - Detail
pages show item snapshots and status timeline. - Reorder is available
only for currently available items and requires price revalidation. -
Lists support pagination or incremental loading.

#### US-D03: Track an order

**As a student,** I want to follow order status, so that I know when
food is being prepared or delivered.

Acceptance criteria: - Timeline includes the relevant states: placed,
confirmed, awaiting rider, in transit, delivered, or cancelled. - Status
transitions come from the server. - Realtime updates may use Socket.IO
in the backend phase; provide a sensible refresh/polling fallback. -
Map/rider location is shown only if the required data and permissions
exist. - Loading, offline, and stale update states are communicated.

#### US-D04: Cancel an eligible order

**As a student,** I want to cancel when policy permits, so that I can
respond to changed plans.

Acceptance criteria: - Explain refund consequences before
confirmation. - Cancellation eligibility and refund percentage are
decided server-side. - After pickup, show the dispute route rather than
an ordinary cancellation action. - Repeated requests must be
idempotent. - UI displays the final server-confirmed result.

#### US-D05: Rate a completed order

**As a student,** I want to rate eligible completed orders, so that I
can provide feedback.

Acceptance criteria: - Only eligible completed orders can be rated. -
Shop and rider ratings are supported where applicable. - Prevent
duplicate ratings unless editing is explicitly allowed. - Show
submission and validation feedback. - Rating aggregates are calculated
and validated server-side.

### EPIC E --- Shop owner operations

#### US-E01: View shop dashboard

**As a shop owner,** I want a summary of orders and performance, so that
I can manage my business.

Acceptance criteria: - KPI cards include today's orders, revenue,
average rating, and relevant order statuses. - Charts use Recharts and
clearly label dates, currency, and values. - Revenue only includes
server-defined qualifying transactions. - Loading skeletons, empty
states, and error states are present. - Only data belonging to the
authenticated owner's authorized shop is returned.

#### US-E02: Manage menu

**As a shop owner,** I want to create, edit, reorder, and disable menu
items, so that the menu stays accurate.

Acceptance criteria: - CRUD forms validate name, category, price,
description, preparation time, and image as applicable. - Availability
toggle shows pending and success/failure states. - Image upload includes
progress, validation, and failure feedback. - Server verifies shop
ownership for every mutation. - Existing order item snapshots do not
change when a menu price changes.

#### US-E03: Process incoming orders

**As a shop owner,** I want to accept, reject, and update orders, so
that customers receive accurate updates.

Acceptance criteria: - Incoming orders display key details and a clear
action set. - Only legal status transitions are available. - The
response timeout policy is communicated. - Rejection/cancellation
refunds are server-controlled. - Updates are reflected in the customer
order timeline.

#### US-E04: Verify pickup

**As a shop owner,** I want to verify the rider handover, so that the
correct order leaves the shop.

Acceptance criteria: - Show the order identity and QR
scanning/verification state. - A failed, expired, or reused QR token is
rejected with a clear message. - Successful verification is recorded
server-side and is single-use. - Do not mark pickup successful from a
frontend-only scan result.

#### US-E05: View earnings and transactions

**As a shop owner,** I want to inspect earnings and transactions, so
that I understand my balance.

Acceptance criteria: - Show available balance, pending balance if
applicable, and transaction history. - Clearly label currency as BDT
(৳). - Withdrawal is available only when the backend supports and
authorizes it. - Transaction history is read-only and reconciles with
server records.

### EPIC F --- Rider operations

#### US-F01: Set availability

**As an approved rider,** I want to set myself available or unavailable,
so that I control whether I receive delivery offers.

Acceptance criteria: - Current availability is clearly visible. -
Ineligible/suspended riders cannot become available. - State is
persisted server-side once the backend exists. - Explain when an active
delivery prevents going offline.

#### US-F02: Browse and claim deliveries

**As a rider,** I want to view eligible delivery offers and claim one,
so that I can earn money.

Acceptance criteria: - Offer card shows pickup, destination summary,
estimated distance/earning where available, and order age. - Claim
action has loading, success, conflict, and network failure states. - The
backend uses an atomic claim operation so only one rider wins. - A
conflict refreshes the feed rather than leaving a false claimed state. -
Do not expose unnecessary customer information before assignment.

#### US-F03: Complete pickup and delivery

**As a rider,** I want to follow a clear delivery workflow, so that I
can complete the handover correctly.

Acceptance criteria: - Show ordered steps and a clear current step. -
Pickup and delivery use distinct QR verification flows. - Expired,
invalid, or reused QR tokens fail safely. - Completion and escrow
release require server confirmation. - Provide a recovery/help path when
scanning fails.

#### US-F04: View rider earnings

**As a rider,** I want to see completed deliveries and earnings, so that
I can track my work.

Acceptance criteria: - Show delivery count, qualifying earnings, and
transaction history. - Leaderboards are optional and must not reveal
private data. - Totals reconcile with backend ledger/transaction data. -
Loading, empty, and error states are provided.

### EPIC G --- Payment, escrow, QR, and policy

#### US-G01: Initiate payment

**As a student,** I want to pay through an approved payment flow, so
that the order can proceed.

Acceptance criteria: - Payment UI supports the selected provider's
supported flow (bKash sandbox in initial integration plan). - Provider
callbacks/webhooks are validated server-side. - Do not store raw payment
credentials. - Duplicate callbacks and repeated submissions are
idempotent. - Frontend never fabricates a successful payment result.

#### US-G02: Maintain escrow ledger

**As the platform,** I want to record escrow events immutably, so that
funds can be audited.

Acceptance criteria: - Ledger entries are append-only: lock, release, or
refund events create new records. - Multi-document money movement uses
MongoDB transactions where supported. - Release happens only after the
authorized delivery confirmation and payment conditions are met. - The
proposed initial split is 85% shop, 12% rider, and 3% platform, subject
to final business/legal approval. - Failed transactions leave no
partially applied ledger split.

#### US-G03: Verify single-use QR tokens

**As an authorized participant,** I want QR-based handover verification,
so that pickup and delivery are recorded securely.

Acceptance criteria: - Pickup and delivery have distinct token
purposes. - Tokens are bound to the order and authorized participant. -
Tokens expire after the configured period (initial proposal: 10 minutes)
and are single-use. - Server validates token, order state, user, expiry,
and used status. - Raw reusable secrets are not stored in plaintext
where avoidable.

#### US-G04: Apply cancellation policy

**As the platform,** I want a consistent cancellation policy, so that
refunds and consequences are predictable.

Acceptance criteria: - Placed and unconfirmed: proposed 100% refund. -
Shop confirmed/preparing: proposed 80% refund. - Rider assigned/en
route: proposed 50% refund. - Picked up: ordinary cancellation
unavailable; dispute required. - Shop-initiated cancellation: proposed
100% refund plus a 5 BDT credit. - The backend is the source of truth;
the UI previews policy but cannot determine final refunds. - Product
owner must confirm exact policy and edge cases before launch.

#### US-G05: Enforce shop response timeout and cancellation strikes

**As the platform,** I want timeouts and repeated late cancellations
handled consistently, so that users and shops are treated fairly.

Acceptance criteria: - Proposed shop response timeout is two minutes;
final behavior must be confirmed. - Automatic rejection/refund is
idempotent and auditable. - Track late-stage customer cancellations in a
rolling 30-day window. - Proposed rule: third qualifying late
cancellation triggers a seven-day ordering suspension. - Provide the
user with a clear explanation and appeal/support path.

### EPIC H --- Notifications

#### US-H01: Receive notifications

**As a user,** I want relevant order and account notifications, so that
I know when action is needed.

Acceptance criteria: - Notification list shows title, message,
timestamp, read state, and destination. - Unread count is reflected in
the navbar. - Users can mark notifications read. - Realtime
delivery/push notifications are added only when their server
infrastructure is implemented. - Do not include secrets or excessive
private information in notification text.

### EPIC I --- Admin and dispute management

#### US-I01: Review shop applications

**As an admin,** I want to approve or reject shop applications, so that
only authorized shops operate.

Acceptance criteria: - List supports pending status, search, and detail
review. - Approval/rejection requires confirmation; rejection requires a
reason. - Every decision is audited. - Owner permissions change only
after the backend records the approved state.

#### US-I02: Manage users

**As an admin,** I want to find and suspend/reinstate users, so that I
can handle abuse and policy violations.

Acceptance criteria: - Search and filter by role and status. - Show a
confirmation dialog and reason for consequential actions. - Suspension
is enforced by the backend across protected operations. - Do not expose
password hashes, session tokens, or unnecessary personal information.

#### US-I03: Resolve disputes

**As an admin,** I want to review evidence and issue an authorized
resolution, so that order problems can be resolved fairly.

Acceptance criteria: - Show order history, relevant status timeline, and
submitted evidence. - Resolution actions require authorization and a
reason. - Refunds are processed through backend payment/ledger logic. -
All actions are auditable and idempotent.

#### US-I04: Monitor platform performance

**As an admin,** I want platform-wide metrics, so that I can monitor
operations.

Acceptance criteria: - KPI cards and Recharts charts show clearly
defined metrics and date ranges. - Tables support filtering, pagination,
and loading/error states. - Metrics are derived from server-authorized
aggregate queries. - No fabricated production analytics.

### EPIC J --- Reliability, accessibility, and quality

#### US-J01: Understand data-loading states

**As a user,** I want clear feedback while data loads or fails, so that
I understand what the app is doing.

Acceptance criteria: - Each data screen has loading, empty, error, and
success states. - Use skeletons for content-heavy screens. - Retry is
available for recoverable failures. - Lazy-load large charts, QR
scanning modules, and other heavy client-only UI when appropriate.

#### US-J02: Use the app on mobile

**As a mobile user,** I want the application to adapt to my screen, so
that I can complete core tasks without horizontal scrolling.

Acceptance criteria: - Core journeys work at 320px, 375px, 768px, and
desktop widths. - Touch targets are comfortable. - Forms, tables,
dialogs, and drawers fit the viewport. - Keyboard focus and
reduced-motion preferences are respected.

#### US-J03: Trust navigation and access control

**As a user,** I want to see only the actions appropriate to my account,
so that the application is understandable and secure.

Acceptance criteria: - Navigation reflects the authenticated role. -
`proxy.js` performs early redirects for protected route groups. - Every
protected server page and backend endpoint validates the session and
permissions. - Frontend visibility is not treated as authorization. -
Role changes and privileged access require trusted server-side
workflows.

------------------------------------------------------------------------

## 6. Core screens inventory

### Public and authentication

1.  Landing/marketing page
2.  Login
3.  Registration role selector
4.  Student registration
5.  Shop-owner application
6.  Rider registration
7.  Verification/status screen
8.  Password recovery
9.  Not-found and error pages

### Student

10. Home/shop discovery
11. Search results
12. Filters/sort drawer
13. Shop detail/menu
14. Cart
15. Checkout/payment status
16. Order tracking
17. Order history
18. Order detail
19. Rating/review
20. Profile and settings
21. Notifications

### Shop owner

22. Dashboard
23. Live order queue
24. Order detail and pickup verification
25. Menu list
26. Create/edit menu item
27. Earnings/transactions
28. Shop settings and application status

### Rider

29. Availability state
30. Available delivery feed
31. Delivery detail
32. Active delivery and pickup verification
33. Delivery confirmation
34. Earnings/history
35. Rider profile

### Admin

36. Dashboard/analytics
37. Shop applications and detail
38. User management
39. Order monitoring
40. Dispute queue and resolution
41. Audit/transaction details where authorized

------------------------------------------------------------------------

## 7. Suggested implementation phases

### Phase 1 --- Frontend foundation

-   Create Next.js App Router project in JavaScript.
-   Install HeroUI, Tailwind CSS, Lucide React, Motion, Recharts, Better
    Auth, MongoDB driver, TanStack Query, React Hook Form, Zod, and
    supporting packages.
-   Establish theme tokens, shared providers, navbar, theme toggle,
    drawer patterns, and responsive layout.
-   Configure Better Auth with MongoDB-backed sessions and the
    `proxy.js` route guard.
-   Verify build and session endpoint.

### Phase 2 --- Shared design system and authentication UI

-   Build reusable buttons, inputs, password toggle, cards, dialogs,
    toasts, skeletons, empty states, and error states.
-   Build login, registration role selector, and role-specific
    registration UI.
-   Verify authentication flows before protected dashboards.

### Phase 3 --- Student discovery and cart

-   Build shop grid, search, filters, shop detail, menu, cart, and
    checkout presentation.
-   Use mock data behind service functions that will later call the API.

### Phase 4 --- Shop-owner experience

-   Build owner dashboard, order queue, menu management, shop settings,
    earnings screens, and responsive sidebar/drawer.

### Phase 5 --- Rider experience

-   Build availability, available order feed, active delivery, QR
    workflow UI, and earnings screens.

### Phase 6 --- Admin experience

-   Build approvals, user management, dispute queue, order monitoring,
    and analytics.

### Phase 7 --- Backend and database

-   Implement Express.js API in JavaScript using MVC.
-   Define MongoDB/Mongoose collections, indexes, validation, services,
    repositories where useful, and route/controller structure.
-   Connect Better Auth session validation to protected operations.
-   Implement orders, shop approval, rider claims, payment adapter,
    escrow, QR verification, cancellation rules, notifications, and
    audit history.
-   Use Redis, Socket.IO, job queues, and external integrations where
    justified.

### Phase 8 --- Integration and testing

-   Replace mock service implementations with real API calls.
-   Add unit, integration, and end-to-end tests.
-   Verify authorization, idempotency, transaction behavior, race
    conditions, and error handling.
-   Test accessibility, responsive layouts, performance, and production
    deployment.

------------------------------------------------------------------------

## 8. Definition of done

A user story is not complete until: - Its UI matches the shared design
system and works responsively. - Validation and all
loading/empty/error/success states exist. - Keyboard navigation and
accessible labels work. - Role permissions are enforced by the server
where relevant. - API-connected features handle unauthorized,
validation, network, and server errors. - Important business actions are
auditable and safe against duplicate submissions. - Automated tests
cover critical behavior. - Documentation and environment variable
examples are updated.

**Important:** A polished mockup is not a production-ready payment,
authorization, or delivery system. Payment, escrow, role permissions, QR
verification, refunds, and order transitions must be implemented and
verified on the server before launch.
