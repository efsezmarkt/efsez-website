# EFSEZ local backend

This folder contains the local development API used while building the site.

Production currently runs through Vercel Functions in `frontend/api` and uses Neon/Postgres.
The local backend uses SQLite so the frontend can be tested without a remote database.

## Commands

```sh
npm run dev
```

The API starts on `http://localhost:4000` unless `PORT` is set.

## Notes

- `backend/server.js` is the active entry point.
- `backend/src/server.js` contains the local SQLite API.
- Empty `routes`, `models`, and `middleware` files are not used by the active backend.
