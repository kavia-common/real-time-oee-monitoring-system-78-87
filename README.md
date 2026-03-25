# Real-Time OEE Monitoring System (MERN + Socket.IO)

This repository contains a full-stack OEE (Overall Equipment Effectiveness) monitoring app with a React frontend, an Express + MongoDB backend, and Socket.IO for real-time updates. It includes role-based access control (operator, supervisor, manager), event logging (downtime and quality rejects), alerts, and a manager-only PDF “shift handover” report export.

## Architecture at a glance

The system is split into three parts that you run locally:

The database is MongoDB, started via Docker Compose (`docker-compose.yml` in the repo root). The backend is an Express server in `backend/` that exposes a REST API under `/api` and a Socket.IO server under `/socket.io`. The frontend is a React app in `frontend/` that authenticates via JWT, calls the REST API, and subscribes to Socket.IO events.

## Prerequisites

You need Docker (for MongoDB) and Node.js + npm (for backend and frontend). The commands below assume you run them from the repository root (`real-time-oee-monitoring-system-78-87/`).

## Step-by-step local setup

### 1) Start MongoDB (Docker Compose)

From the repo root:

```bash
docker compose up -d
```

MongoDB is exposed on `localhost:27017`.

Mongo Express (optional) is exposed on:

- http://localhost:8081

The Compose file uses dev-friendly credentials:

- username: `root`
- password: `example`
- database: `oee`

If you need the exact connection string for CLI tools, see:

- `database/db_connection.txt`

### 2) Configure and start the backend (Express)

In a second terminal:

```bash
cd backend
npm install
cp .env.example .env
```

Then start the backend in dev mode:

```bash
npm run dev
```

By default the backend listens on:

- http://localhost:5000

#### Backend environment variables

The backend reads its configuration from `backend/.env`. The included `backend/.env.example` is the recommended starting point.

These values are used by the backend:

- `PORT` (default `5000`)
- `NODE_ENV` (default `development`)
- `TRUST_PROXY` (`true`/`false`)
- `LOG_LEVEL` (for example `info`)
- `MONGODB_URI` (should match your docker-compose Mongo credentials)
- `JWT_SECRET` (set to any dev secret; change for production)
- `JWT_EXPIRES_IN` (for example `12h`)
- `CORS_ORIGINS` (comma-separated list; typically `http://localhost:3000`)
- `OEE_ALERT_THRESHOLD` (for example `0.75`)

### 3) Seed the database (sample users)

With MongoDB running and the backend `.env` in place, seed sample users.

From `backend/`:

```bash
node src/scripts/seed.js
```

This creates (if they do not already exist) three users, one per role:

- operator: `operator@example.com` / `operator123`
- supervisor: `supervisor@example.com` / `supervisor123`
- manager: `manager@example.com` / `manager123`

Note: there is no `npm run seed` script defined in `backend/package.json` at the moment, so use the `node src/scripts/seed.js` command above.

### 4) Configure and start the frontend (React)

In a third terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs on:

- http://localhost:3000

#### Frontend environment variables

The frontend uses Create React App environment variables (must start with `REACT_APP_`). There is no committed `.env` in `frontend/` by default, but you can create one locally as `frontend/.env`.

At minimum, you should set the backend base URL (both REST and websocket can use the same base):

```bash
# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:5000
```

The frontend code resolves URLs like this:

- REST base: `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL`
- Socket.IO base: `REACT_APP_WS_URL` or `REACT_APP_BACKEND_URL`

So an expanded configuration that is explicit looks like:

```bash
# frontend/.env
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

Other `REACT_APP_*` variables may exist in your runtime environment, but only the variables above are required for this app’s API + realtime connectivity.

## Verifying the system is running

Once all three services are up:

1. Confirm MongoDB is running via Docker:

   ```bash
   docker ps
   ```

2. Confirm backend health endpoint:

   - `GET http://localhost:5000/health`

3. Open the frontend:

   - http://localhost:3000

If you see login/role errors in the UI, confirm that:

- the backend is running on `http://localhost:5000`
- `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000`
- `REACT_APP_BACKEND_URL` (or `REACT_APP_API_BASE`) in `frontend/.env` points to the backend

## Basic role-based usage flows

The frontend has three role-gated routes:

- `/` Operator dashboard (requires role `operator` or higher)
- `/supervisor` Supervisor dashboard (requires role `supervisor` or higher)
- `/manager` Manager dashboard (requires role `manager`)

If you sign in as a lower role and attempt to visit a higher role route, you will be redirected to an unauthorized page.

### Operator flow (real-time KPI dashboard + logging)

1. Sign in as the operator seed user:

   - `operator@example.com` / `operator123`

2. Open the Operator dashboard (`/`).

3. Choose a line (for example `line-1`).

4. Start a run using “Start run”. This calls the backend run start endpoint.

5. Log downtime events and quality rejects during the run. These create backend records and update the realtime snapshot.

6. Watch realtime KPIs (Availability, Performance, Quality, OEE) and the trend chart. The UI uses a REST snapshot plus Socket.IO events (notably `oee:snapshot`).

### Supervisor flow (alerts + acknowledgement + log review)

1. Sign in as:

   - `supervisor@example.com` / `supervisor123`

2. Open the Supervisor dashboard (`/supervisor`).

3. Select a line and view open (unacknowledged) alerts.

4. Acknowledge an alert using the “Acknowledge” button. This triggers the backend alert acknowledgement route.

5. Review recent downtime and quality logs for the selected line.

### Manager flow (history + PDF report export)

1. Sign in as:

   - `manager@example.com` / `manager123`

2. Open the Manager dashboard (`/manager`).

3. View run history for the selected line.

4. Download a shift handover PDF by selecting a time window and clicking “Download PDF”.

The backend endpoint used is:

- `GET /api/reports/shift-handover.pdf?lineId=...&shiftStart=...&shiftEnd=...`

This route is restricted to the `manager` role.

## Useful references in this repo

- `docker-compose.yml`: MongoDB + Mongo Express for local development
- `database/README.md`: database container notes and connection string
- `backend/README.md`: backend API notes, roles, realtime events, PDF export
- `backend/.env.example`: backend environment template
- `backend/src/scripts/seed.js`: seed script that creates sample users
- `frontend/src/services/http.js`: REST URL construction and request helper
- `frontend/src/services/realtime.js`: Socket.IO connection helper

## Stopping everything

To stop MongoDB + Mongo Express:

```bash
docker compose down
```

The backend and frontend dev servers can be stopped with `Ctrl+C` in their terminals.