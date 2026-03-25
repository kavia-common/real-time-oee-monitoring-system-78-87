# Database (MongoDB) container

This folder documents the development MongoDB container used by the backend.

## Start MongoDB (development)

From the repo workspace root:

```bash
docker compose up -d
```

- MongoDB: `mongodb://localhost:27017`
- Mongo Express UI: http://localhost:8081

## Connection string

See `db_connection.txt` (contains a `mongosh "<connection-string>"` line).

## Backend configuration

Set the backend environment variable:

- `MONGODB_URI=mongodb://root:example@localhost:27017/oee?authSource=admin`

Then start the backend (from `backend/`):

```bash
npm run dev
```

## Seed data

Once MongoDB is running and `MONGODB_URI` is configured, you can seed from `backend/`:

```bash
npm run seed
```
