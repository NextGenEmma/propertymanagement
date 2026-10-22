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
- `/api/listings` and `/api/listings/facets`: public property discovery with city, buy/rent, type, text, bedroom, and budget filters. Only published listings are returned, with street and postal address withheld.
- `GET /api/listings/:listingId` and `POST /api/listings/:listingId/inquiries`: view a published home and send a direct inquiry to its owner.
- `/api/properties`: owners can create and update properties; owners and assigned managers can view accessible properties. Owners can publish sale or rental listings using `isPublished` plus listing details on `PATCH /api/properties/:propertyId`.
- `POST /api/properties/:propertyId/managers`: owners create a single-use, seven-day manager invitation for an email address. Deliver the returned token to the invitee through a secure channel.
- `POST /api/auth/accept-manager-invite`: the invitee submits the token, name, email, and password to create a manager account and receive a bearer token.
- `/api/properties/:propertyId/tenants`: create, list, update tenant lease records.
- `/api/properties/:propertyId/rent-payments`: create and list monthly rent records; mark a payment paid with `PATCH /:paymentId/paid`.
- `/api/properties/:propertyId/maintenance`: create, list, and update maintenance requests.
- `/api/properties/:propertyId/inquiries`: owners and assigned managers can review listing inquiries and update their follow-up status.

Send `Authorization: Bearer <token>` on all property, tenant, rent, and maintenance endpoints. Public registration creates owner accounts only; manager accounts must redeem a property-owner invitation.

The React client includes a `Discover homes` view with search, curated property types, owner listings, saved homes, listing details, and inquiry submission. Owners can edit and publish a listing from the property detail panel; inquiries appear in `Buyer inquiries`.

This MVP stores operational records only. It does not process payments or provide tax, FEMA, or legal compliance advice.
