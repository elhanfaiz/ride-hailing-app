# Uber Clone System Architecture

## Overview

This project is a monorepo with two deployable applications:

- `client`: React + Tailwind web app for riders, drivers, and admins
- `server`: Express + MongoDB API with Socket.io for real-time ride orchestration

## High-Level Flow

1. The rider authenticates with JWT-based login.
2. The rider requests a fare estimate and creates a ride request.
3. The backend stores the ride, calculates fare, and assigns an online driver.
4. Socket.io broadcasts ride state changes and driver location updates.
5. The driver accepts, navigates, starts, and completes the ride.
6. Payments are recorded through mock mode or Stripe PaymentIntents.
7. The admin panel reads analytics from aggregated ride, user, driver, and payment data.

## Backend Architecture

- `controllers/`: request handling and orchestration
- `models/`: MongoDB domain models
- `routes/`: REST endpoints grouped by bounded context
- `middleware/`: auth, validation, error handling
- `services/`: long-lived services like Socket.io event handling
- `utils/`: reusable helpers such as fare and geo math

## Frontend Architecture

- `pages/`: route-level experiences
- `components/`: reusable UI modules grouped by domain
- `context/`: auth and socket state
- `api/`: Axios client and API wrappers
- `layouts/`: shared shell and navigation

## Real-Time Channels

- `ride:new-request`: pushed to drivers
- `ride:created`: sent when a ride is created
- `ride:updated`: sent when ride status changes
- `ride:driver-location`: streams driver coordinates during active trips
- `admin:ride-updated`: keeps admin dashboards live

## Security

- bcrypt password hashing
- JWT auth with role-aware middleware
- express-validator request validation
- centralized API error handling
