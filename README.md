# real-time-oee-monitoring-system-78-87

## Development quickstart (MongoDB + Backend + Frontend)

### 1) Start MongoDB (Docker)
From this folder:

```bash
docker compose up -d
```

Mongo Express UI (optional): http://localhost:8081

### 2) Configure & run backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Backend defaults to: http://localhost:5000

### 3) Run frontend
```bash
cd ../frontend
npm install
npm start
```

Frontend defaults to: http://localhost:3000