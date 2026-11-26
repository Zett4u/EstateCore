# ESTATECORE — PHASE 5.0 BACKEND API IMPLEMENTATION REPORT
**Academic Source of Truth:** `estatecire.pdf` (Cabico, Cristina O. | BSIT 4-C — Lab Activity 05 & 06)  
**Target Environment:** Sandbox (`estatecore_test_restore` on MySQL Port 3307)  
**Routing Standard:** Canonical `/api/v1` with transparent `/api` backward-compatible middleware  
**Milestone:** Phase 5.0 — Academic Requirements Implementation  

---

## 1. Executive Summary

This report documents the implementation and verification of all 19 REST API endpoints specified in **Lab Activity 05** of `estatecire.pdf`. The backend architecture was extended in NestJS with modular service layers, TypeORM data repositories, class-validator DTOs, global JWT authentication guards, and fine-grained resource-level Role-Based Access Control (RBAC).

All 19 endpoints were tested against the sandbox environment using `scripts/test_phase5_academic_endpoints.js`, achieving **100.0% pass rate (34/34 assertions)**.

---

## 2. Academic 19-Endpoint Implementation Matrix (Lab 05 Compliance)

| EP # | Method | Path | Summary / Operation | Auth & Permitted Roles | HTTP Success | HTTP Error Codes |
|---|---|---|---|---|---|---|
| **01** | `POST` | `/api/v1/users` | Register new user account | Public | `201 Created` | `400 Bad Request`, `409 Conflict` |
| **02** | `GET` | `/api/v1/users/:id` | Retrieve user profile by ID | Bearer (Self or `ADMIN`) | `200 OK` | `401`, `403 Forbidden`, `404 Not Found` |
| **03** | `PATCH` | `/api/v1/users/:id` | Update own account fields | Bearer (Self or `ADMIN`) | `200 OK` | `400`, `401`, `403 Forbidden`, `404` |
| **04** | `DELETE` | `/api/v1/users/:id` | Deactivate / delete account | Bearer (`ADMIN` only) | `204 No Content` / `200 OK` | `401`, `403 Forbidden`, `404 Not Found` |
| **05** | `GET` | `/api/v1/agents` | Public accredited agents directory | Public | `200 OK` | `400 Bad Request` |
| **06** | `POST` | `/api/v1/agents` | Create professional agent profile | Bearer (`AGENT` self, `ADMIN`) | `201 Created` | `400`, `401`, `409 Conflict` |
| **07** | `GET` | `/api/v1/properties` | Search & filter property catalog | Public | `200 OK` | `400 Bad Request` |
| **08** | `GET` | `/api/v1/properties/:id` | Detailed listing information | Public | `200 OK` | `404 Not Found` |
| **09** | `POST` | `/api/v1/properties` | Publish new property listing | Bearer (`AGENT`, `ADMIN`) | `201 Created` | `400`, `401`, `403 Forbidden` |
| **10** | `PUT` | `/api/v1/properties/:id` | Complete listing replacement | Bearer (Assigned Agent, `ADMIN`)| `200 OK` | `400`, `401`, `403 Forbidden`, `404` |
| **11** | `PATCH` | `/api/v1/properties/:id` | Partial listing field update | Bearer (Assigned Agent, `ADMIN`)| `200 OK` | `400`, `401`, `403 Forbidden`, `404` |
| **12** | `DELETE`| `/api/v1/properties/:id` | Remove property listing | Bearer (Assigned Agent, `ADMIN`)| `200 OK` / `204` | `401`, `403`, `409 Conflict` (Transactions) |
| **13** | `GET` | `/api/v1/properties/:id/photos` | List property gallery photos | Public | `200 OK` | `404 Not Found` |
| **14** | `POST` | `/api/v1/properties/:id/photos` | Upload/attach property photo | Bearer (Assigned Agent, `ADMIN`)| `201 Created` | `400`, `401`, `403 Forbidden`, `404` |
| **15** | `POST` | `/api/v1/properties/:id/inquiries` | Submit client inquiry or price offer| Bearer (`CLIENT`) | `201 Created` | `400`, `401`, `404 Not Found` |
| **16** | `GET` | `/api/v1/properties/:id/inquiries` | View property inquiries | Bearer (Assigned Agent, `ADMIN`)| `200 OK` | `401`, `403 Forbidden`, `404` |
| **17** | `PATCH`| `/api/v1/properties/:id/inquiries/:inqId`| Update inquiry status | Bearer (Assigned Agent, `ADMIN`)| `200 OK` | `400`, `401`, `403 Forbidden`, `404` |
| **18** | `POST` | `/api/v1/transactions` | Record property transaction deal | Bearer (`AGENT`, `ADMIN`) | `201 Created` | `400`, `401`, `403`, `409 Conflict` |
| **19** | `GET` | `/api/v1/transactions/:id` | Retrieve financial deal receipt | Bearer (Buyer, Agent, `ADMIN`) | `200 OK` | `401`, `403 Forbidden`, `404` |

---

## 3. Detailed Endpoint Implementation Details

### 3.1. Users & Identity (EP 1 – 4)
- **EP 1 (`POST /users`):** Implemented in `UsersController.registerUser`. Accepts `firstName`, `lastName`, `email`, `contactNumber`, `password`, and optional `role`. Hashes password with bcrypt (10 rounds). Checks duplicate email and returns `409 Conflict`.
- **EP 2 (`GET /users/:id`):** Enforces horizontal authorization (BOLA). A client or agent can only view their own user profile; `ADMIN` can view any user profile. Cross-user attempts return `403 Forbidden`.
- **EP 3 (`PATCH /users/:id`):** Permits updating `contactNumber`, `fullName`, and `email` with duplicate email validation.
- **EP 4 (`DELETE /users/:id`):** Restricted exclusively to `ADMIN`. Non-admin requests receive `403 Forbidden`. Performs soft deactivation (`isActive = false`) to preserve relational integrity.

### 3.2. Professional Agents Directory (EP 5 – 6)
- **EP 5 (`GET /agents`):** Public accredited agents directory supporting pagination (`?page=1&limit=10`) and filter by `agencyName`. Returns accredited broker name, license status, and contact metadata.
- **EP 6 (`POST /agents`):** Allows an authenticated `AGENT` to register their professional profile, or `ADMIN` to accredit an agent. Enforces uniqueness on `licenseNumber`, returning `409 Conflict` if the license is already registered.

### 3.3. Properties & Digital Assets (EP 7 – 14)
- **EP 7 (`GET /properties`):** High-performance catalog filter supporting `propertyType`, `listingType`, `status`, `minPrice`, `maxPrice`, `search`, and `location`.
- **EP 8 (`GET /properties/:id`):** Detailed listing information including joined agent profile, owner metadata, and photo gallery.
- **EP 9 (`POST /properties`):** Requires `AGENT` or `ADMIN`. Automatically assigns `agentId` to the authenticated agent's profile, preventing agent spoofing.
- **EP 10 & 11 (`PUT` & `PATCH /properties/:id`):** Verifies that the authenticated agent is the assigned listing agent (`property.agentId === agentProfile.id`). Cross-agent edits return `403 Forbidden`.
- **EP 12 (`DELETE /properties/:id`):** Implements transaction delete protection. Checks `property_transactions` repository; if transactions exist, returns `409 Conflict` to preserve financial auditability.
- **EP 13 & 14 (`GET` & `POST /properties/:id/photos`):** Supports both JSON file references and multipart file uploads (`uploads/properties/{id}/`) with MIME validation and disk storage. Cross-agent uploads return `403 Forbidden`.

### 3.4. Inquiries & Price Offers (EP 15 – 17)
- **EP 15 (`POST /properties/:id/inquiries`):** Enables buyers to submit general inquiries or formal price offers (`inquiryType = 'Offer'`, `offerAmount = 5100000`). Enforces email-only notification dispatch.
- **EP 16 (`GET /properties/:id/inquiries`):** Returns all inquiries for a property. Restricted to the assigned listing agent and `ADMIN`. Unassigned agents receive `403 Forbidden`.
- **EP 17 (`PATCH /properties/:id/inquiries/:inquiryId`):** Allows the listing agent to update inquiry status (`PENDING`, `CONTACTED`, `QUALIFIED`, `CLOSED`). Cross-agent updates return `403 Forbidden`.

### 3.5. Transactions & Financial Ledger (EP 18 – 19)
- **EP 18 (`POST /transactions`):** Records completed sales or lease contracts. Validates that the property is managed by the calling agent, checks buyer validity, and returns `409 Conflict` if the property is already `SOLD` or `RENTED`. Transitions property status to `SOLD`.
- **EP 19 (`GET /transactions/:id`):** Strict financial access control: viewable only by the purchasing buyer (`buyerId === user.id`), the listing broker (`agentId === agent.id`), or `ADMIN`. Uninvolved third parties receive `403 Forbidden`.

---

## 4. Academic Response Envelopes & Error Formatting

All endpoints comply with the standard academic JSON format:
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```
Error responses adhere to NestJS `AllExceptionsFilter` with clear semantic HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).
