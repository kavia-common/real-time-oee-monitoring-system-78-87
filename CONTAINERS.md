# Containers in this workspace (assessment)

## Existing containers

### 1) `frontend/` (React)
- Path: `real-time-oee-monitoring-system-78-87/frontend`
- Purpose: Web UI for real-time OEE monitoring.
- Current behavior: Can run with mock data, and optionally connect to backend via env vars:
  - `REACT_APP_WS_URL` (WebSocket)
  - `REACT_APP_API_BASE` / `REACT_APP_BACKEND_URL` (HTTP)

## Existing containers (updated)

### 1) `frontend/` (React)
- Path: `real-time-oee-monitoring-system-78-87/frontend`
- Purpose: Web UI for real-time OEE monitoring.
- Current behavior: Can run with mock data, and optionally connect to backend via env vars:
  - `REACT_APP_WS_URL` (WebSocket)
  - `REACT_APP_API_BASE` / `REACT_APP_BACKEND_URL` (HTTP)

### 2) `backend/` (Node.js + Express + Socket.IO)
- Path: `real-time-oee-monitoring-system-78-87/backend`
- Purpose: REST API + JWT auth + RBAC + real-time updates + PDF export.
- Major endpoints:
  - `GET /health`
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
  - `POST /api/runs/start`, `POST /api/runs/stop`, `GET /api/runs`
  - `POST /api/downtime`, `GET /api/downtime`
  - `POST /api/quality`, `GET /api/quality`
  - `GET /api/oee/realtime`
  - `GET /api/reports/shift-handover.pdf`
- Real-time:
  - Socket.IO server at `/socket.io`
  - Rooms: `line:<lineId>`
  - Events: `oee:snapshot`, `alert:new`, `run:updated`, `downtime:created`, `quality:created`
- Backend env vars (see `backend/.env.example`):
  - `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`, `OEE_ALERT_THRESHOLD`, ...

## Containers that still need to be created

### 3) `database/` (MongoDB)
This can be either:
- A dedicated “database container” if the platform supports managed Mongo containers, OR
- A local/development Docker service (docker-compose) if allowed by the project setup.

Recommended new container directory (if implemented as a container in-repo):
- Path: `real-time-oee-monitoring-system-78-87/database`

Responsibilities:
- Provide MongoDB connectivity for backend
- Store all app collections (users, lines, runs, downtime, quality, shifts, alerts, reports, etc.)
- Provide:
  - `db_connection.txt` with a usable `mongosh <connection-string>` line (per project MongoDB rules)
  - Optional seed scripts / initial dataset

## Summary
- Current repo only has a React frontend container.
- To fulfill a MERN + Socket.IO stack, add:
  - `backend/` (Node/Express + Socket.IO + JWT/RBAC + PDF endpoints)
  - `database/` (MongoDB + seed/connection info)
