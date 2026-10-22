# CampusEats – Authentication & Role Flow Fix Guide

This document describes the **correct** behavior for authentication, role selection, signup, and access control in CampusEats. Follow these rules exactly so the app no longer auto-redirects on role click, shows a proper role-aware signup page, and only displays relevant toasts.

---

## 1. Core Principles

| Rule | Behavior |
|------|----------|
| Public access | Anyone (logged-in or not) can view the **Home Page**. |
| Protected routes | Any other page (dashboard, shop queue, delivery, admin, etc.) requires authentication. If not logged in → redirect to **Sign In**. |
| No auto-login on role click | Clicking Student / Shop Owner / Rider / Admin on the Sign-In page must **never** log the user in or redirect. Those buttons are only for demo convenience (optional) or should be removed. |
| Role is set only after successful auth | Active role is determined by the authenticated user’s account, never by a temporary selection. |
| Only one role active | After login, the top navigation shows **only the role that belongs to the current user**. |

---

## 2. Sign-In Page (`/signin`)

### What should be present
- Campus Email / Username field
- Password field
- “Forgot your password?” link
- **Sign In** button
- Link at the bottom:  
  `Don't have a CampusEats account?` → **Choose role and register** (goes to `/signup`)

### What must be removed or fixed
- **Instant Demo Role Sign-In** section (Student / Shop Owner / Rider / Admin buttons)  
  → These currently cause automatic redirect / fake login.  
  → **Delete the whole section** or make the buttons do nothing more than pre-fill a demo email (optional, not required).

### After successful Sign-In
1. Validate credentials.
2. Store auth token + user object (including `role`).
3. Redirect to **Home Page** (`/`).

---

## 3. Sign-Up Page (`/signup`) – New Page Required

Create a dedicated `/signup` route.

### Step 1 – Role Selection (first screen or top of the form)
Show four clear role cards/buttons:

- Student
- Shop Owner
- Rider
- Admin

User **must** select one role before the form becomes usable.

### Step 2 – Dynamic Form (changes according to selected role)

Common fields for every role:
- Full Name
- Campus Email (must end with `@du.ac.bd` or allowed domain)
- Username (optional or required)
- Password
- Confirm Password
- Phone Number

Role-specific extra fields:

| Role        | Extra Fields |
|-------------|--------------|
| **Student** | Student ID, Hall / Dormitory Name, Room Number |
| **Shop Owner** | Shop Name, Shop Location / Stall Number, Shop Category |
| **Rider**   | Vehicle Type (Bicycle / Motorcycle), License Number (if applicable), Preferred Delivery Zones |
| **Admin**   | Admin Code / Invitation Key (required for security) |

### After successful Sign-Up
1. Create the account with the selected role.
2. Show a success toast: `"Account created successfully. Please sign in."`
3. Redirect to **Sign-In page** (`/signin`).
4. Do **not** auto-login the user.

---

## 4. Navigation & Active Role Display

### Top bar (Header)
- Logo + “CampusEats” + campus badge
- Navigation links (Browse Shops, etc.)
- Notification / theme toggle
- **Auth area**:
  - If **not logged in** → “Sign In” button
  - If **logged in** → User avatar / name + dropdown that shows:
    - The **single role** of the current user (e.g. “Student”, “Shop Owner”)
    - Link to role-specific dashboard
    - Sign Out

**Never** show multiple role options in the top bar.  
Only the role that belongs to the authenticated user should appear.

---

## 5. Route Protection Rules

```ts
// Pseudocode
function ProtectedRoute({ children }) {
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}
```

| Route | Access |
|-------|--------|
| `/` (Home) | Public – anyone can view |
| `/signin` | Public |
| `/signup` | Public |
| `/student/*` | Authenticated + role === "student" |
| `/shop/*`   | Authenticated + role === "shop_owner" |
| `/rider/*`  | Authenticated + role === "rider" |
| `/admin/*`  | Authenticated + role === "admin" |
| Any other protected page | Authenticated |

If a logged-in user tries to open a route for a different role → redirect to their own dashboard or home.

---

## 6. Toast Policy (Remove Unnecessary Toasts)

Only show toasts for these events:

| Event | Toast Type | Message Example |
|-------|------------|-----------------|
| Successful Sign-In | success | “Welcome back!” |
| Successful Sign-Up | success | “Account created successfully. Please sign in.” |
| Sign-In failure | error | “Invalid email or password.” |
| Sign-Up failure (validation / server) | error | Specific error message |
| Sign-Out | info (optional) | “Signed out successfully.” |
| Network / unexpected error | error | “Something went wrong. Please try again.” |

**Remove** any toast that appears when:
- Simply selecting a role
- Navigating between public pages
- Loading the home page
- Any demo / role-click action

---

## 7. Recommended File / Component Structure

```
src/
├── pages/
│   ├── Home.tsx                 # Public
│   ├── SignIn.tsx
│   ├── SignUp.tsx               # New – role selection + dynamic form
│   └── ...
├── components/
│   ├── auth/
│   │   ├── RoleSelector.tsx     # Used in SignUp
│   │   ├── SignUpForm.tsx       # Dynamic fields based on role
│   │   └── ProtectedRoute.tsx
│   └── layout/
│       └── Header.tsx           # Shows only current user’s role
├── context/ or store/
│   └── AuthContext.tsx          # user, role, isAuthenticated, login, logout
└── types/
    └── auth.ts                  # Role = "student" | "shop_owner" | "rider" | "admin"
```

---

## 8. Implementation Checklist

- [ ] Delete or disable the “Instant Demo Role Sign-In” buttons on `/signin`
- [ ] Create `/signup` page with role selection
- [ ] Make signup form fields change according to selected role
- [ ] After signup → redirect to `/signin` + success toast
- [ ] After signin → redirect to Home (`/`)
- [ ] Header shows only the authenticated user’s single role
- [ ] Home page remains public
- [ ] All other app pages are protected → redirect to `/signin` if not logged in
- [ ] Remove every unnecessary toast
- [ ] Only relevant success / error toasts remain

---

## 9. Example User Flows

### New User
1. Lands on Home (public) → clicks “Sign In” or “Choose role and register”
2. Goes to `/signup` → selects role → fills form → submits
3. Sees success toast → redirected to `/signin`
4. Signs in → redirected to Home
5. Header now shows only their role + profile menu

### Existing User
1. Goes to `/signin` → enters credentials → Sign In
2. Redirected to Home
3. Can access only routes that match their role

### Unauthenticated User
- Can freely browse Home and public pages
- Clicking any protected feature → taken to `/signin`
- On Sign-In page can choose “Choose role and register” if they have no account

---

## 10. Notes for Developers

- Keep the role strictly inside the authenticated user object. Never store a temporary “selectedRole” that affects routing.
- Validate the role on both client and server.
- For Admin signup, require a secret invitation code to prevent open registration.
- Use the same design system (dark theme, green accents) already present on the Sign-In page for consistency.

Once these rules are followed, the auto-redirect problem disappears, a proper role-aware signup exists, the top bar shows only the correct role, and only meaningful toasts appear.