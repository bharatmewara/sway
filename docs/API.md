# SWAY Dating Platform - REST & WebSocket API Specification

## 1. Overview
The SWAY backend exposes a RESTful API under the `/api` prefix, supplemented by a real-time WebSocket server powered by Socket.io.

Base URL: `http://localhost:5000/api`

---

## 2. Authentication & Authorization
All secured endpoints expect a JSON Web Token in the HTTP Authorization header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 3. API Endpoints

### 3.1 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in with email/username and password | No |
| `POST` | `/api/auth/logout` | Invalidate current session and set offline | Yes |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset instructions | No |

### 3.2 User Management (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users` | List active users with pagination | Yes |
| `GET` | `/api/users/:id` | Fetch specific user profile details | Yes |
| `GET` | `/api/users/preferences` | Retrieve user matching preferences | Yes |
| `PUT` | `/api/users/preferences` | Update user matching preferences | Yes |
| `GET` | `/api/users/privacy` | Retrieve user privacy settings | Yes |
| `PUT` | `/api/users/privacy` | Update incognito/blur/visibility settings | Yes |

### 3.3 Profiles & Media (`/api/profile`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/profile/me` | Fetch personal profile details | Yes |
| `PUT` | `/api/profile/me` | Update bio, location, education, interests | Yes |
| `POST` | `/api/profile/photo` | Upload primary or gallery photo | Yes |
| `GET` | `/api/profile/photos` | List user's gallery photos | Yes |
| `DELETE` | `/api/profile/photos/:photoId` | Delete specific gallery photo | Yes |
| `GET` | `/api/profile/:id` | View public profile of a user | Yes |

### 3.4 Discovery & Swiping (`/api/discovery`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/discovery/feed` | Fetch candidate queue based on preferences | Yes |
| `POST` | `/api/discovery/swipe` | Record like, pass, or super-like | Yes |

### 3.5 Matches (`/api/matches`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/matches` | Retrieve all mutual active matches | Yes |
| `DELETE` | `/api/matches/:userId` | Disconnect / unmatch with a user | Yes |

### 3.6 Messaging & Conversations (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | List active conversations with unread count | Yes |
| `GET` | `/api/messages/conversations/:id/messages` | Fetch message history for a conversation | Yes |
| `POST` | `/api/messages/messages` | Send message to a user | Yes |
| `PUT` | `/api/messages/conversations/:id/read` | Mark all messages in conversation as read | Yes |

### 3.7 Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | Fetch user notifications | Yes |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| `PUT` | `/api/notifications/:id/read` | Mark individual notification as read | Yes |

### 3.8 Moderation & Safety (`/api/reports`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/reports` | Submit abuse, spam, or misconduct report | Yes |
| `POST` | `/api/reports/block` | Block user from contacting or appearing | Yes |

### 3.9 Monetization & Subscriptions (`/api/subscription`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/subscription/plans` | Fetch available subscription tiers | No |
| `GET` | `/api/subscription/packs` | Fetch connect credit bundles | No |
| `POST` | `/api/subscription/purchase` | Complete purchase of credits or plan | Yes |

---

## 4. Real-Time WebSocket Events (Socket.io)

### Client to Server:
- `send_message`: `{ receiver_id, content, message_type, conversation_id }`
- `typing`: `{ receiver_id, conversation_id }`
- `stop_typing`: `{ receiver_id, conversation_id }`
- `join_conversation`: `{ conversation_id }`
- `leave_conversation`: `{ conversation_id }`
- `mark_read`: `{ conversation_id, sender_id }`

### Server to Client:
- `new_message`: Pushes received message object in real time
- `typing` / `stop_typing`: Live indicator for typing
- `messages_read`: Read receipt notification
- `new_match`: Alert for mutual match
- `online_status`: User presence update `{ userId, isOnline, lastSeen }`
