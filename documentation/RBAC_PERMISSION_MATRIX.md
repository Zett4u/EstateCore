# EstateCore — Role-Based Access Control (RBAC) & Ownership Matrix
### Reconciled Security Architecture: Laboratory Activity 06 & Enterprise Model

This matrix specifies allowed operations, ownership boundaries, and HTTP response codes across all system endpoints and entities, reconciling the PDF roles (**Guest**, **Buyer/Renter**, **Seller/PropertyManager**, **Agent**, **Admin**) with EstateCore's core runtime roles (**ADMIN**, **AGENT**, **CLIENT**).

---

## 1. Role Reconciliation Model

| PDF Persona | EstateCore Runtime Role | Relationship Anchor | Description & Privileges |
| :--- | :--- | :--- | :--- |
| **Guest** | *Unauthenticated* | None (`No JWT`) | Public discovery. Can browse public listings, view photos, search, and register an account. Cannot book viewings or inquire. |
| **Buyer / Renter** | `CLIENT` | `User.UserID = BuyerID` / `Inquiry.UserID` | Prospective customer. Can submit inquiries, make price offers, schedule and cancel viewing tours, and view own purchase/lease deals. |
| **Seller / PropertyManager** | `CLIENT` / `ADMIN` | `Property.OwnerID = User.UserID` | Property deed holder or developer. Can list property for representation, review assigned agent status, and inspect deal transactions on their assets. |
| **Agent** | `AGENT` | `Agent.UserID` / `Property.AgentID` | Licensed real estate professional. Must possess verified `Agent` profile with `LicenseNumber`. Manages assigned listings, responds to inquiries, conducts tours, and creates transactions. |
| **Admin** | `ADMIN` | System-wide root | System administrator. User governance, global platform oversight, dispute resolution, and listing lifecycle management. |

---

## 2. Granular Endpoint Permission Matrix

| # | Endpoint URI | Method | Guest | Buyer / Renter (`CLIENT`) | Seller / Owner (`CLIENT`) | Agent (`AGENT`) | Admin (`ADMIN`) | Ownership Enforcement | Denial Code |
| :- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| **1** | `/api/v1/auth/register` | `POST` | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** | Self registration only allows `CLIENT` role. Privileged roles rejected. | `400 Bad Request` |
| **2** | `/api/v1/auth/login` | `POST` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Credential verification against bcrypt `PasswordHash`. | `401 Unauthorized` |
| **3** | `/api/v1/users/{id}` | `GET` | **DENY** | **OWN** | **OWN** | **OWN** | **ALLOW** | Non-admins may only view their own user profile (`sub === id`). | `403 Forbidden` |
| **4** | `/api/v1/users/{id}` | `PATCH` | **DENY** | **OWN** | **OWN** | **OWN** | **ALLOW** | Cannot self-elevate `role`. Only Admin can change roles. | `403 Forbidden` |
| **5** | `/api/v1/users/{id}` | `DELETE` | **DENY** | **DENY** | **DENY** | **DENY** | **ALLOW** | Admin only. Soft-deactivates user (`IsActive = 0`). | `403 Forbidden` |
| **6** | `/api/v1/agents` | `GET` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Public directory of licensed real estate agents. | `200 OK` |
| **7** | `/api/v1/agents` | `POST` | **DENY** | **DENY** | **DENY** | **ALLOW** | **ALLOW** | Creates `Agent` profile. Requires `Agent` role and unique `LicenseNumber`. | `403 Forbidden` |
| **8** | `/api/v1/properties` | `GET` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Public property portfolio search, filtering, and pagination. | `200 OK` |
| **9** | `/api/v1/properties/{id}` | `GET` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Public single property dossier with specifications. | `404 Not Found` |
| **10** | `/api/v1/properties` | `POST` | **DENY** | **DENY** | **DENY** | **ALLOW** | **ALLOW** | Agent or Admin only. Sets `AgentID` to token's agent record. | `403 Forbidden` |
| **11** | `/api/v1/properties/{id}` | `PATCH`/`PUT` | **DENY** | **DENY** | **OWN** | **OWN** | **ALLOW** | Only the assigned listing `Agent` or asset `Owner` or `Admin` can edit. | `403 Forbidden` |
| **12** | `/api/v1/properties/{id}` | `DELETE` | **DENY** | **DENY** | **DENY** | **OWN** | **ALLOW** | Cannot delete property if active transactions exist (`409 Conflict`). | `403` / `409` |
| **13** | `/api/v1/properties/{id}/photos`| `GET` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | Public photo gallery of listing. | `200 OK` |
| **14** | `/api/v1/properties/{id}/photos`| `POST` | **DENY** | **DENY** | **DENY** | **OWN** | **ALLOW** | Only assigned agent or admin may attach listing photos. | `403 Forbidden` |
| **15** | `/api/v1/properties/{id}/inquiries` | `POST` | **DENY** | **ALLOW** | **ALLOW** | **DENY** | **DENY** | Buyer/Renter submits question or price offer (`OfferAmount > 0`). | `401` / `403` |
| **16** | `/api/v1/properties/{id}/inquiries` | `GET` | **DENY** | **DENY** | **DENY** | **OWN** | **ALLOW** | Only the assigned listing agent or admin can view received inquiries. | `403 Forbidden` |
| **17** | `/api/v1/inquiries` | `GET` | **DENY** | **OWN** | **OWN** | **OWN** | **ALLOW** | Clients see own sent inquiries; Agents see inquiries on their listings. | `403 Forbidden` |
| **18** | `/api/v1/properties/{id}/inquiries/{inquiryId}` | `PATCH` | **DENY** | **DENY** | **DENY** | **OWN** | **ALLOW** | Only assigned agent can update status (`Accepted`, `Rejected`, `Replied`). | `403 Forbidden` |
| **19** | `/api/v1/transactions` | `POST` | **DENY** | **DENY** | **DENY** | **ALLOW** | **ALLOW** | Only authorized agents or admin record deals. Verifies property is available. | `403` / `409` |
| **20** | `/api/v1/transactions/{id}` | `GET` | **DENY** | **OWN** | **OWN** | **OWN** | **ALLOW** | Only the Buyer involved, the Handling Agent, or Admin can inspect deal. | `403 Forbidden` |
| **21** | `/api/v1/appointments` | `POST` | **DENY** | **ALLOW** | **ALLOW** | **DENY** | **DENY** | Client requests viewing tour. Validates future date and no agent conflicts. | `400` / `409` |
| **22** | `/api/v1/appointments` | `GET` | **DENY** | **OWN** | **OWN** | **OWN** | **ALLOW** | Clients view own booked tours; Agents view tours assigned to them. | `403 Forbidden` |
| **23** | `/api/v1/appointments/{id}` | `PATCH` | **DENY** | **OWN** | **DENY** | **OWN** | **ALLOW** | Client may cancel tour (`CANCELLED`). Agent may confirm (`CONFIRMED`). | `403 Forbidden` |

---

## 3. Strict Denial Enforcement Rules

1. **Unauthenticated Access (`401 Unauthorized`)**:
   Returned whenever a protected endpoint is accessed without an `Authorization: Bearer <token>` header, or if the token signature is invalid or expired.
2. **Unauthorized Access (`403 Forbidden`)**:
   Returned when the user is logged in, but:
   - Does not possess the required application role (e.g. `CLIENT` attempting to call `POST /api/v1/properties`).
   - Does not own the resource (e.g. `Agent 3` attempting to edit a listing assigned to `Agent 2`, or `Client A` accessing `Client B`'s inquiries).
   - Attempts to self-escalate roles via `PATCH /api/v1/users/{id}`.
3. **Conflict & Business Logic Violations (`409 Conflict`)**:
   - Creating a transaction on a property with status `Sold`.
   - Attempting to delete a property that has linked historical transactions.
   - Registering a duplicate email address or duplicate PRC agent license number.
   - Booking a tour when the assigned agent already has a confirmed tour at the exact same date and time.
