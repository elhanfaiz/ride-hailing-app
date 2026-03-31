# Uber Clone

A full-stack Uber-style ride hailing application built with:

- React + Tailwind CSS
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- Socket.io for ride updates and live tracking
- Mock payments with optional Stripe PaymentIntents

## Architecture

The platform is split into a `client` and `server` monorepo setup:

- `client`: responsive rider, driver, and admin web app
- `server`: REST API, auth, ride orchestration, analytics, and realtime sockets

More detail is in [docs/architecture.md](./docs/architecture.md).

## Folder Structure

```text
.
├── client
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   │   ├── admin
│   │   │   ├── common
│   │   │   ├── driver
│   │   │   └── rider
│   │   ├── context
│   │   ├── layouts
│   │   └── pages
├── docs
├── server
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── seed
│   │   ├── services
│   │   └── utils
└── package.json
```

## Features

### Rider

- Register, login, logout
- Fare estimation
- Create ride requests
- View nearby drivers
- Track active ride in real time
- Ride history
- Mock or Stripe-backed payment creation

### Driver

- Register and login
- Go online or offline
- Accept or reject ride requests
- Update ride lifecycle from arrival to completion
- Earnings and trip dashboard
- Live location streaming through Socket.io

### Admin

- Dashboard analytics
- User management view
- Driver fleet view
- Ride monitoring panel

## Backend API Overview

### Auth

- `POST /api/auth/users/register`
- `POST /api/auth/users/login`
- `POST /api/auth/drivers/register`
- `POST /api/auth/drivers/login`
- `GET /api/auth/me`

### Rides

- `POST /api/rides/estimate`
- `POST /api/rides`
- `GET /api/rides`
- `GET /api/rides/:rideId`
- `PATCH /api/rides/:rideId/cancel`

### Drivers

- `GET /api/drivers/nearby?lat=24.8607&lng=67.0011`
- `PATCH /api/drivers/availability`
- `PATCH /api/drivers/location`
- `GET /api/drivers/rides`
- `GET /api/drivers/dashboard`
- `PATCH /api/drivers/rides/:rideId/respond`
- `PATCH /api/drivers/rides/:rideId/status`

### Payments

- `POST /api/payments`
- `GET /api/payments`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/drivers`
- `GET /api/admin/rides`

## Environment Variables

### Server

Copy `server/.env.example` to `server/.env`.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/uber-clone
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_MAPS_API_KEY=
MAPBOX_ACCESS_TOKEN=
MAP_PROVIDER=mapbox
STRIPE_SECRET_KEY=
DEFAULT_CURRENCY=usd
BASE_FARE=2.5
PER_KM_RATE=1.75
PER_MIN_RATE=0.35
SURGE_MULTIPLIER=1
```

### Client

Copy `client/.env.example` to `client/.env`.

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPBOX_ACCESS_TOKEN=
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB locally.

3. Seed demo data:

```bash
npm run seed
```

4. Start the backend:

```bash
npm run dev:server
```

5. Start the frontend in a second terminal:

```bash
npm run dev:client
```

## Demo Accounts

- Admin: `admin@uberclone.dev` / `password123`
- Rider: `rider@uberclone.dev` / `password123`
- Driver: `driver1@uberclone.dev` / `password123`

## Testing Instructions

Run the full monorepo test suite with:

```bash
npm test
```

Run only one workspace if needed:

```bash
npm run test:server
npm run test:client
```

### Manual

1. Login as a rider and estimate a fare.
2. Book a ride and verify a driver is attached.
3. Login as a driver in another browser session and accept the ride.
4. Move the ride through `driver_arriving`, `in_progress`, and `completed`.
5. Login as an admin and verify dashboard metrics update.

### Current automated coverage

- Backend `node:test` coverage for:
  - auth controller driver login success and failure paths
  - fare and geo utility calculations
  - backward-compatible driver password comparison
- Frontend `node:test` coverage for:
  - runtime API and socket URL resolution
  - rider booking form normalization and coordinate defaults

### Recommended next coverage

- API integration tests with Supertest
- Frontend component tests with Vitest + React Testing Library
- E2E tests with Playwright or Cypress

## Deployment Guide

### Backend

- Deploy on Render, Railway, Fly.io, or a VPS
- Set all server environment variables
- Use MongoDB Atlas for production MongoDB
- Point `CLIENT_URL` to the deployed frontend URL

### Frontend

- Build with `npm --workspace client run build`
- Deploy `client/dist` to Vercel, Netlify, or Cloudflare Pages
- Set `VITE_API_URL` and `VITE_SOCKET_URL` to the deployed backend

### Realtime

- Ensure the backend platform supports WebSockets
- Enable sticky sessions if your infra requires them

## Notes

- The UI is intentionally modern and Uber-inspired, while still being original code.
- Map rendering is represented through live coordinates and ready-to-wire map tokens. You can swap in Google Maps or Mapbox components using the provided env values.
- Stripe is optional. If no Stripe secret is configured, the mock payment path still works.
// elhan faiz 