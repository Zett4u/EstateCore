# ESTATECORE — REST API REFERENCE MANUAL

**Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student:** Cabico, Cristina O. | BSIT 4-C  
**Version:** 1.0 (Final Academic Defense Release)  
**Base URL:** `http://localhost:3000/api/v1` (with backward-compatible rewrite from `/api`)  

---

## 1. Authentication & Security Headers

### 1.1 Bearer Token Authorization
All protected endpoints require the HTTP Authorization header:
```http
Authorization: Bearer <jwt_access_token>
```

### 1.2 Standard Response Envelope
Successful responses return HTTP `200 OK`, `201 Created`, or `204 No Content`.
Error responses conform to RFC 7807 uniform error format:
```json
{
  "statusCode": 400,
  "timestamp": "2026-11-26T03:13:00.000Z",
  "path": "/api/v1/properties",
  "method": "POST",
  "error": "Bad Request",
  "message": [
    "Title is required.",
    "Property type is required."
  ]
}
```

---

## 2. API Endpoints by Domain Module

### Module 1: Authentication (`/auth`)
- `POST /auth/register` — Register a new client account.
  - Body: `{ fullName, email, password }`
  - Returns: HTTP 201 with created user metadata (excluding password).
- `POST /auth/login` — Authenticate credentials and issue JWT.
  - Body: `{ email, password }`
  - Returns: HTTP 200 with `{ accessToken, user }`. (Includes `agentId` claim for Agent accounts).
- `POST /auth/logout` — Server-side revocation of session JWT.
  - Headers: `Authorization: Bearer <token>`
  - Returns: HTTP 200 with revocation confirmation.
- `GET /auth/me` — Retrieve current authenticated user profile.
  - Headers: `Authorization: Bearer <token>`
  - Returns: HTTP 200 with profile metadata.

### Module 2: Users Management (`/users`)
- `GET /users` — Admin query users catalog.
  - Query params: `role`, `isActive`
  - Returns: HTTP 200 with array of user objects.
- `POST /users` — Create user account.
  - Body: `{ fullName, email, password, contactNumber, role }`
  - Returns: HTTP 201 with created user record.
- `GET /users/:id` — Retrieve user profile by ID (Admin or own profile).
  - Returns: HTTP 200 with user profile.
- `PATCH /users/:id` — Partial update user details.
  - Body: `{ fullName?, contactNumber? }`
  - Returns: HTTP 200 with updated user.
- `PUT /users/:id` — Full replacement update user.
  - Body: `{ fullName, contactNumber }`
  - Returns: HTTP 200 with updated user.
- `DELETE /users/:id` — Soft-delete / deactivate user (Admin only).
  - Returns: HTTP 204 No Content.

### Module 3: Agents Directory (`/agents`)
- `GET /agents` — Public directory of active agents.
  - Returns: HTTP 200 with list of agents and user profiles.
- `GET /agents/:id` — Public get agent details by ID.
  - Returns: HTTP 200 with agent record.
- `POST /agents` — Create agent profile (Admin or Agent).
  - Body: `{ userId, agencyName?, licenseNumber?, phoneNumber? }`
  - Returns: HTTP 201 with created agent profile.
- `PATCH /agents/:id` — Partial update agent profile.
  - Body: `{ agencyName?, licenseNumber?, phoneNumber? }`
  - Returns: HTTP 200 with updated agent.
- `PUT /agents/:id` — Full replacement update agent profile.
  - Body: `{ agencyName, licenseNumber, phoneNumber }`
  - Returns: HTTP 200 with updated agent.

### Module 4: Properties Catalog (`/properties`)
- `GET /properties` — Public browse properties with multi-parameter filtering.
  - Query params: `propertyType`, `listingType`, `status`, `minPrice`, `maxPrice`, `location`, `search`
  - Returns: HTTP 200 with matching property listings.
- `GET /properties/:id` — Public get single property detail.
  - Returns: HTTP 200 with property specification, photos, and agent contact info.
- `POST /properties` — Create property listing (Agent, Admin, or Client).
  - Body: `{ title, description, propertyType, listingType, price, location, address, bedrooms, bathrooms, floorArea }`
  - Returns: HTTP 201 with created listing and automatic ownership attribution.
- `PATCH /properties/:id` — Partial update listing (Authorized Agent, Admin, or Owner).
  - Body: Partial properties object.
  - Returns: HTTP 200 with updated listing.
- `PUT /properties/:id` — Full update listing.
  - Body: Full property specification.
  - Returns: HTTP 200 with updated listing.
- `DELETE /properties/:id` — Delete listing (Cascade deletes photos, protected if inquiries exist).
  - Returns: HTTP 200 or 204.
- `GET /properties/:id/photos` — Public retrieve photos gallery for listing.
  - Returns: HTTP 200 with photo items array.
- `POST /properties/:id/photos` — Upload photographic media asset.
  - Body: `{ filePath, caption?, isPrimary? }` or multipart form data.
  - Returns: HTTP 201 with created photo record.
- `POST /properties/:id/inquiries` — Submit nested inquiry for listing.
  - Body: `{ message, offerAmount? }`
  - Returns: HTTP 201 with created inquiry.
- `GET /properties/:id/inquiries` — List inquiries for property (Listing Agent or Admin).
  - Returns: HTTP 200 with paginated inquiry items.
- `PATCH /properties/:id/inquiries/:inquiryId` — Update inquiry status via property route.
  - Body: `{ status: 'CONTACTED' | 'QUALIFIED' | 'CLOSED' }`
  - Returns: HTTP 200 with updated inquiry.

### Module 5: Standalone Inquiries (`/inquiries`)
- `POST /inquiries` — Direct inquiry creation.
  - Body: `{ propertyId, message, offerAmount? }`
  - Returns: HTTP 201 with inquiry record.
- `GET /inquiries` — List inquiries with role-based visibility.
  - Returns: HTTP 200 with user-scoped inquiries.
- `GET /inquiries/:id` — Get single inquiry detail.
  - Returns: HTTP 200 with inquiry record.
- `PATCH /inquiries/:id` — Update inquiry status.
  - Body: `{ status }`
  - Returns: HTTP 200 with updated inquiry.
- `DELETE /inquiries/:id` — Remove inquiry (Admin only).
  - Returns: HTTP 204 No Content.

### Module 6: Appointments Scheduling (`/appointments`)
- `POST /appointments` — Schedule viewing appointment.
  - Body: `{ propertyId, agentId, appointmentDate, appointmentTime, notes? }`
  - Returns: HTTP 201 with booked appointment record.
- `GET /appointments` — List appointments for authenticated user.
  - Returns: HTTP 200 with appointment schedule list.
- `GET /appointments/:id` — Retrieve appointment details.
  - Returns: HTTP 200 with appointment specification.
- `PATCH /appointments/:id` — Update appointment status or time.
  - Body: `{ status?, appointmentDate?, appointmentTime?, notes? }`
  - Returns: HTTP 200 with updated appointment.
- `DELETE /appointments/:id` — Cancel viewing appointment.
  - Returns: HTTP 204 No Content.

### Module 7: Property Transactions (`/transactions`)
- `POST /transactions` — Record property financial sale settlement.
  - Body: `{ propertyId, buyerId, amount, transactionType, paymentMethod, notes? }`
  - Returns: HTTP 201 with audited transaction record and automatic transition of property to `SOLD`.
- `GET /transactions` — List transactions (Admin, Agent, or Buyer).
  - Returns: HTTP 200 with transaction records.
- `GET /transactions/:id` — Retrieve audited transaction record by ID.
  - Returns: HTTP 200 with transaction details.
