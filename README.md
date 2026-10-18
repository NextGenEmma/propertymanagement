# Property Management API

MongoDB-backed property management API for owners living abroad and their India-based managers. Property, rent, and maintenance amounts default to INR; property timezones default to `Asia/Kolkata`.

## Run

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`, set `MONGO_URI`, and replace `JWT_SECRET` with a long random secret.
3. Start MongoDB, then run `npm run dev`.
4. Run the API tests with `npm test`.

The API listens on port `5000` by default. `GET /` is a liveness check; `GET /health` reports MongoDB readiness.

## Web application

Start the API from the repository root with `npm run dev`. In a second terminal, run `cd client` and `npm install`, then `npm run dev`. Open `http://localhost:5173/`; the Vite development server proxies `/api` and `/health` to the backend on port `5000`.

## Services

- `POST /api/auth/register` and `POST /api/auth/login`: create owner or manager accounts and issue 12-hour bearer tokens.
- `/api/properties`: owners can create and update properties; owners and assigned managers can view accessible properties.
- `POST /api/properties/:propertyId/managers`: owners create a single-use, seven-day manager invitation for an email address. Deliver the returned token to the invitee through a secure channel.
- `POST /api/auth/accept-manager-invite`: the invitee submits the token, name, email, and password to create a manager account and receive a bearer token.
- `/api/properties/:propertyId/tenants`: create, list, update tenant lease records.
- `/api/properties/:propertyId/rent-payments`: create and list monthly rent records; mark a payment paid with `PATCH /:paymentId/paid`.
- `/api/properties/:propertyId/maintenance`: create, list, and update maintenance requests.

Send `Authorization: Bearer <token>` on all property, tenant, rent, and maintenance endpoints. Public registration creates owner accounts only; manager accounts must redeem a property-owner invitation.

This MVP stores operational records only. It does not process payments or provide tax, FEMA, or legal compliance advice.
