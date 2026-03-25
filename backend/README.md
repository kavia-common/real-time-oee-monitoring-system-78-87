# OEE Monitor Backend (Express + MongoDB + Socket.IO)

This container provides:
- REST API for production runs, downtime, quality events, OEE snapshots, alerts
- JWT authentication + role-based access control (RBAC)
- Socket.IO real-time updates
- PDF shift-handover export

## Setup

1) Install deps:
```bash
npm install
```

2) Create environment file:
```bash
cp .env.example .env
```

3) Run:
```bash
npm run dev
```

Server defaults to `http://localhost:5000`.

## Roles
- `operator`
- `supervisor`
- `manager`

## Health
- `GET /health`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Real-time (Socket.IO)
- Connect to Socket.IO at `/socket.io`
- Client can emit `subscribe` with `{ lineId }` to join a room `line:<lineId>`
- Server emits:
  - `oee:snapshot`
  - `alert:new`
  - `run:updated`
  - `downtime:created`
  - `quality:created`

## PDF Shift Handover
- `GET /api/reports/shift-handover.pdf?lineId=...&shiftStart=...&shiftEnd=...`
  - returns a PDF summary: OEE, top downtime reasons, units produced/rejected
"""
