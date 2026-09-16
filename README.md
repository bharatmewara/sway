# SWAY Dating App - Full Stack Setup Guide

## Quick Start

### 1. Configure Database
Edit `server/.env` and set your PostgreSQL password:
```
DB_PASSWORD=your_postgres_password
```

### 2. Set up Database
```bash
cd server
node setup-db.js
```

### 3. Configure Razorpay
In `server/.env`, add your Razorpay test keys:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
```
Get keys from: https://dashboard.razorpay.com/app/keys

### 4. Copy Images to Client
```bash
# Copy the img folder to client/public
xcopy /E /I "d:\Dating\img" "d:\Dating\client\public\img"
```

### 5. Start All Servers

**Terminal 1 - Backend:**
```bash
cd d:\Dating\server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd d:\Dating\client
npm run dev
```

**Terminal 3 - Admin Panel:**
```bash
cd d:\Dating\admin
npm run dev
```

## Access URLs
- **Frontend**: http://localhost:5173
- **Admin Panel**: http://localhost:5174/admin/login
- **Backend API**: http://localhost:5000/api

## Admin Credentials
- Email: `admin@sway.com`
- Password: `Admin@123`

## Features
- ✅ Full user registration with gender selection
- ✅ AI-simulated facial verification (women: selfie only)
- ✅ Document verification (men: selfie + govt ID)
- ✅ Admin verification review queue
- ✅ Credits system (1 credit/message for males, free for females)
- ✅ Real-time chat via Socket.io
- ✅ Nearby members with radius filter
- ✅ Razorpay credit purchase (Pack 25/100/400)
- ✅ Admin panel with city analytics, user management, revenue charts
- ✅ Connection requests, crushes, visitors
- ✅ Private photos with access control

## Credit System
| Action | Credits |
|--------|---------|
| Send message (males) | 1 |
| Send crush | 5 |
| Send connection request | 5 |
| View private photos | 10 |
| Females | FREE (all actions) |

## Credit Packs
| Pack | Credits | Price |
|------|---------|-------|
| Pack 25 | 25 | ₹1,500 |
| Pack 100 | 100 | ₹4,200 |
| Pack 400 | 400 | ₹9,600 |
