# SWAY Production Architecture & Engineering Guide

## 1. High-Level Architecture

SWAY follows a decoupled client-server architecture organized in a clean monorepo workspace.

```
                  ┌──────────────────────┐
                  │    React Client      │
                  │   (Vite + Router 7)  │
                  └──────────┬───────────┘
                             │  HTTP / WebSocket
                             ▼
                  ┌──────────────────────┐
                  │   Express API &      │
                  │   Socket.io Server   │
                  └──────────┬───────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Controllers │──────▶│  Services   │──────▶│Repositories │
└─────────────┘       └─────────────┘       └──────┬──────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │ PostgreSQL  │
                                            └─────────────┘
```

---

## 2. Server Layer Responsibilities

1. **Routes (`src/routes/`)**:
   - HTTP route declarations, path bindings, and mapping to controller methods.
   - Attaches validation middleware (`express-validator`) and authentication guards.

2. **Controllers (`src/controllers/`)**:
   - HTTP request parsing, status codes, and JSON response formatting.
   - Never directly interacts with the database; strictly delegates to services.

3. **Services (`src/services/`)**:
   - Pure business logic layer (eligibility checks, mutual match computation, transaction processing).
   - Coordinates across multiple repositories and emits real-time events.

4. **Repositories (`src/repositories/`)**:
   - Data Access Object (DAO) layer executing SQL queries against the PostgreSQL pool.
   - Encapsulates database transactions, indexing usage, and schema mapping.

5. **Sockets (`src/sockets/`)**:
   - Modular event handlers for real-time messaging, typing events, and alerts.

6. **Jobs (`src/jobs/`)**:
   - Automated maintenance routines for session expiration, notifications, and offline sweep.

---

## 3. Client Layer Responsibilities

1. **Components (`client/src/components/`)**:
   - `common/`: Atomic UI elements (Button, Input, Modal, Loader, Avatar).
   - Domain features: `auth/`, `profile/`, `discovery/`, `matches/`, `chat/`.

2. **Pages (`client/src/pages/`)**:
   - Organized by functional flow:
     - `auth/`: Login, Register, Forgot Password, OTP.
     - `onboarding/`: Profile building wizard.
     - `app/`: Dashboard, Discover, Matches, Messages, Notifications, Profile.
     - `settings/`: Account, Privacy, Notifications, Subscription.

3. **Store (`client/src/store/`)**:
   - Slices for auth, user, matches, and chat with reactive subscriptions.

4. **Services (`client/src/services/`)**:
   - Centralized Axios client with automatic token injection and 401 handling.
