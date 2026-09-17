# SWAY Dating App - Production Architecture

SWAY is a modern, privacy-first verified dating application built on a decoupled architecture with a React frontend and Node.js/Express multi-tier backend.

---

## 📁 Repository Structure

```text
sway/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Static assets & model weights
│   └── src/
│       ├── assets/             # Images, fonts, and icons
│       ├── components/         # Reusable UI component library
│       │   ├── common/         # Button, Input, Modal, Loader, Avatar
│       │   ├── auth/           # LoginForm, RegisterForm, OTPVerification
│       │   ├── profile/        # ProfileCard, Header, Photos, Preferences
│       │   ├── discovery/      # DiscoverCard, SwipeCard, FilterPanel, Actions
│       │   ├── matches/        # MatchCard, MatchList, MatchProfile
│       │   └── chat/           # ChatList, ChatWindow, Message, Input, Typing
│       ├── pages/              # Flow-based page views
│       │   ├── auth/           # Login, Register, ForgotPassword, VerifyOTP
│       │   ├── onboarding/     # Welcome, BasicInfo, Preferences, ProfileSetup
│       │   ├── app/            # Dashboard, Discover, Matches, Messages, Notifications, Profile
│       │   └── settings/       # AccountSettings, PrivacySettings, NotificationSettings, Subscription
│       ├── layouts/            # AuthLayout, MainLayout, ChatLayout
│       ├── hooks/              # useAuth, useSocket, useDebounce, useInfiniteScroll
│       ├── services/           # Axios HTTP API services
│       ├── store/              # Reactive slice state management
│       ├── routes/             # AppRoutes configuration
│       ├── utils/              # Constants, validators, formatters, storage
│       ├── styles/             # Global CSS and design tokens
│       ├── App.jsx             # Root application component
│       └── main.jsx            # Entry point
│
├── server/                     # Node.js backend
│   └── src/
│       ├── config/             # database, env, cloudinary, socket
│       ├── controllers/        # HTTP presentation controllers
│       ├── services/           # Core domain business logic
│       ├── repositories/       # Data Access Objects (SQL queries)
│       ├── routes/             # Express route declarations
│       ├── middleware/         # Auth, error, rateLimit, upload, validation
│       ├── validators/         # Request schemas and sanitizers
│       ├── models/             # Centralized schema models
│       ├── sockets/            # Real-time WebSocket handlers
│       ├── utils/              # JWT, password, logger, response helpers
│       ├── jobs/               # Background tasks and workers
│       ├── app.js              # Express app setup
│       └── server.js           # HTTP server and socket startup
│
├── database/                   # Migrations, seeds, and SQL schema
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── uploads/                    # User media uploads
├── docs/                       # Architecture, API, and DB documentation
│   ├── API.md
│   ├── DATABASE.md
│   └── ARCHITECTURE.md
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
└── package.json
```

---

## 🚀 Getting Started

### 1. Installation
Install all dependencies across root, server, and client:
```bash
npm run install:all
```

### 2. Environment Setup
Copy `.env.example` to `server/.env` and update your PostgreSQL credentials:
```bash
cp .env.example server/.env
```

### 3. Database Initialization
Import the schema into your PostgreSQL database:
```bash
psql -U postgres -d sway -f database/schema.sql
psql -U postgres -d sway -f database/seeds/001_demo_seed.sql
```

### 4. Running Development Servers
Start both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`
