# Containers in this workspace (assessment)

## Existing containers

### 1) `frontend/` (React)
- Path: `real-time-oee-monitoring-system-78-87/frontend`
- Purpose: Web UI for real-time OEE monitoring.
- Current behavior: Can run with mock data, and optionally connect to backend via env vars:
  - `REACT_APP_WS_URL` (WebSocket)
  - `REACT_APP_API_BASE` / `REACT_APP_BACKEND_URL` (HTTP)

## Containers that need to be created (to support MERN + Socket.IO + MongoDB)

### 2) `backend/` (Node.js + Express + Socket.IO)
Recommended new container directory:
- Path: `real-time-oee-monitoring-system-78-87/backend`

Responsibilities:
- REST API (Express)
- Authentication:
  - JWT login/register
  - Password hashing (bcrypt)
  - Role-based access control (RBAC) middleware (e.g., admin/supervisor/operator/viewer)
- Real-time:
  - Socket.IO server for streaming OEE snapshots, events, alerts, and production updates
  - Room/topic model by line/area/plant
- Data layer:
  - MongoDB persistence (Mongoose recommended)
- Reporting:
  - Generate PDF handover reports (e.g., via pdfkit/puppeteer) exposed as an API endpoint
- Operational:
  - Health endpoint (`GET /health`)
  - CORS configuration for frontend preview URL(s)

Typical environment variables (backend):
- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGINS` (comma-separated)
- Optional: `LOG_LEVEL`, `TRUST_PROXY`

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
