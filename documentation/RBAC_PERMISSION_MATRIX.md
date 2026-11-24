# EstateCore — Role-Based Access Control (RBAC) & Ownership Matrix (Final Consistency Version)
### Verified Security Architecture Aligned with `estatecire.pdf` Laboratory Activities 05 & 06

This matrix defines the authoritative access rules, ownership boundaries, and HTTP response codes across all system endpoints, directly derived from `estatecire.pdf` (Lab 05 Endpoint Summary Table, pp. 10–11; Lab 06 Access Control Matrix, pp. 21–23).

---

## 1. Role Reconciliation & Persona Mapping

The PDF defines six conceptual roles across the platform. Below is the precise operational mapping to the database and JWT authentication layer:

| PDF Persona | Database `Role` Value | Runtime Identity | JWT Token Claims (`Lab 06, p. 4`) | Permissions & Business Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Guest** | *(None)* | Unauthenticated visitor (`No JWT`) | None | Public discovery. Can browse public property listings, photos, agent directory, and register an account. |
| **Buyer / Renter** | `Buyer` / `Renter` *(or legacy `CLIENT`)* | Registered consumer | `{"sub": "userId", "role": "Buyer"}` | Can submit inquiries and price offers, schedule and cancel personal viewing appointments, and view own deals. |
| **Seller** | `Seller` | Registered property owner | `{"sub": "userId", "role": "Seller"}` | Legal asset deed holder linked via `Property.OwnerID`. May manage and view **only their own properties** (`OwnerID === User.UserID`). |
| **PropertyManager** | `PropertyManager` | Registered property manager | `{"sub": "userId", "role": "PropertyManager"}` | Appointed manager linked via `Property.ManagerID`. May manage **only properties explicitly assigned to them**. Cannot manage unrelated properties. |
| **Agent** | `Agent` *(or legacy `AGENT`)* | Licensed real estate professional | `{"sub": "userId", "role": "Agent", "agentId": 3, "verified": true}` | Must possess a **verified** `Agent` profile (`VerificationStatus = 'VERIFIED'`). Represents listings, conducts tours, replies to inquiries, and creates transactions. |
| **Admin** | `Admin` *(or legacy `ADMIN`)* | System Administrator | `{"sub": "userId", "role": "Admin"}` | Full governance. User administration, agent licensing verification, role management, dispute resolution, and global inquiries oversight. |

### Onboarding & Privilege Elevation Security Rules:
1. **Public Registration (`POST /api/v1/users`)**: Only allows self-registration as consumer or owner roles (`Buyer`, `Renter`, `Seller`). Any payload attempting to supply `role: "Agent"` or `role: "Admin"` is strictly rejected with `400 Bad Request`.
2. **Dedicated Role Management Endpoint (`PATCH /api/v1/users/{id}/role`)**: Restricted to **`Admin` only**. Only an Admin can assign, upgrade, or alter account roles. Standard profile updates (`PATCH /api/v1/users/{id}`) strictly forbid role alteration (`403 Forbidden`).
3. **Agent Onboarding (`POST /api/v1/agents`)**: Restricted to **`Admin` only**. An Agent **cannot** create their own Agent profile or grant themselves professional status.
4. **Pending Verification Enforcement**: An Agent account whose `Agent.VerificationStatus` is `PENDING_VERIFICATION` is **strictly blocked** from publishing listings (`POST /properties`) or executing transactions (`POST /transactions`) until an Admin validates their PRC license.

---

## 2. Definitive Endpoint Access Control Matrix (Lab 05 & Lab 06)

| # | HTTP Method | Endpoint URI (`/api/v1` base) | Guest | Buyer / Renter | Seller | PropertyManager | Agent (Verified) | Admin | Ownership & Access Rule (`Lab 06, p. 4`) | Success Code | Denial Codes |
| :- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **1** | `POST` | `/users` | **Yes** | **Yes** | **Yes** | **No** | **No** | **No** | Public registration (creates `Buyer`/`Renter`/`Seller`). Agents/Admins cannot self-register. | `201 Created` | `400`, `409` |
| **2** | `GET` | `/users/{id}` | **No** | **Own** | **Own** | **Own** | **Own** | **Yes** | Authenticated. Only self (`sub === id`) or Admin can view profile. | `200 OK` | `401`, `403`, `404` |
| **3** | `PATCH` | `/users/{id}` | **No** | **Own** | **Own** | **Own** | **Own** | **No** | Authenticated. Only self can update personal fields. Role is strictly immutable here. | `200 OK` | `400`, `401`, `403`, `404` |
| **3b**| `PATCH` | `/users/{id}/role` | **No** | **No** | **No** | **No** | **No** | **Yes** | **Admin only.** Dedicated administrative role assignment and elevation endpoint. | `200 OK` | `400`, `401`, `403`, `404` |
| **4** | `DELETE`| `/users/{id}` | **No** | **No** | **No** | **No** | **No** | **Yes** | Admin only. Removes or soft-deactivates user account. | `204 No Content`| `401`, `403`, `404` |
| **5** | `GET` | `/agents` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public directory of verified licensed agents (paginated). | `200 OK` | `400` |
| **6** | `POST` | `/agents` | **No** | **No** | **No** | **No** | **No** | **Yes** | **Admin only.** Admin enrolls agent and audits PRC license. Agents cannot self-provision. | `201 Created` | `400`, `401`, `403`, `409` |
| **7** | `GET` | `/properties` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public catalog search, multi-field filters, and pagination. | `200 OK` | `400` |
| **8** | `GET` | `/properties/{id}` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public single property architectural dossier. | `200 OK` | `404` |
| **9** | `POST` | `/properties` | **No** | **No** | **No** | **No** | **Yes** | **No** | Verified Agent only (`agentId` from JWT). Unverified agents rejected with `403`. | `201 Created` | `400`, `401`, `403` |
| **10**| `PUT` | `/properties/{id}` | **No** | **No** | **Own** | **Own** | **Own** | **No** | Agent (own listing) or Seller (own asset, `OwnerID === sub`) or Assigned Manager (`ManagerID === sub`). | `200 OK` | `400`, `401`, `403`, `404` |
| **11**| `PATCH` | `/properties/{id}` | **No** | **No** | **Own** | **Own** | **Own** | **No** | Agent (own listing) or Seller (own asset) or Assigned Manager. | `200 OK` | `400`, `401`, `403`, `404` |
| **12**| `DELETE`| `/properties/{id}` | **No** | **No** | **No** | **No** | **Own** | **Yes** | Agent (own listing) or Admin. Denied with `409 Conflict` if transactions exist. | `204 No Content`| `401`, `403`, `404`, `409` |
| **13**| `GET` | `/properties/{id}/photos` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public photo gallery of listing. | `200 OK` | `404` |
| **14**| `POST` | `/properties/{id}/photos` | **No** | **No** | **No** | **No** | **Own** | **No** | Verified Agent (own listing only). Attaches photo metadata to listing. | `201 Created` | `400`, `401`, `403`, `404` |
| **15**| `POST` | `/properties/{id}/inquiries` | **No** | **Yes** | **No** | **No** | **No** | **No** | Buyer or Renter only. Submits inquiry or price offer (`OfferAmount > 0`). | `201 Created` | `400`, `401`, `404` |
| **16**| `GET` | `/properties/{id}/inquiries` | **No** | **No** | **Own** | **Own** | **Own** | **Yes** | Handling Agent (own listing) or Seller (`OwnerID === sub`) or Manager (`ManagerID === sub`) or Admin. | `200 OK` | `401`, `403`, `404` |
| **17**| `PATCH` | `/properties/{id}/inquiries/{inquiryId}` | **No** | **No** | **No** | **No** | **Own** | **No** | Verified Agent (own listing only). Updates status (`Accepted`, `Rejected`, `Replied`). | `200 OK` | `400`, `401`, `403`, `404` |
| **18**| `POST` | `/transactions` | **No** | **No** | **No** | **No** | **Yes** | **No** | Verified Agent only. Records sale/rental deal. Verifies property is available. | `201 Created` | `400`, `401`, `403`, `404`, `409` |
| **19**| `GET` | `/transactions/{id}` | **No** | **Own** | **Own** | **Own** | **Own** | **Yes** | Buyer involved, Handling Agent, Asset Owner (`OwnerID === sub`), Assigned Manager, or Admin. | `200 OK` | `401`, `403`, `404` |

---

## 3. Supporting Module: Viewing Appointments (EstateCore Extension)

| # | HTTP Method | Endpoint URI | Guest | Buyer / Renter | Seller | PropertyManager | Agent (Verified) | Admin | Ownership & Concurrency Rules | Success Code | Denial Codes |
| :- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **20**| `POST` | `/appointments` | **No** | **Yes** | **No** | **No** | **No** | **No** | Buyer/Renter schedules tour. Enforces future date and exclusive transaction row-lock on Agent record. | `201 Created` | `400`, `401`, `409` |
| **21**| `GET` | `/appointments` | **No** | **Own** | **No** | **No** | **Own** | **Yes** | Buyers view own booked tours; Agents view tours assigned to them; Admin views all. | `200 OK` | `401`, `403` |
| **22**| `PATCH`| `/appointments/{id}` | **No** | **Own** | **No** | **No** | **Own** | **Yes** | Client may cancel (`CANCELLED`). Agent confirms (`CONFIRMED`). | `200 OK` | `400`, `401`, `403`, `404` |

---

## 4. Exact Failure Protocol

- **`401 Unauthorized`**: Returned when `Authorization: Bearer <token>` is missing, malformed, or expired.
- **`403 Forbidden`**: Returned when the user is authenticated, but:
  - Lacks the required role (e.g., Buyer calling `POST /properties`, which is for Verified Agents only).
  - Agent holds `PENDING_VERIFICATION` status and attempts to publish listings or record transactions.
  - Fails the ownership check (e.g., Seller A attempting to edit Seller B's property; Agent 3 editing Agent 2's listing; Client A viewing Client B's inquiry).
  - Attempts privilege escalation (e.g., non-admin attempting to change roles in `PATCH /users/{id}`).
- **`404 Not Found`**: Returned when the target resource ID does not exist in MySQL.
- **`409 Conflict`**: Returned on state or uniqueness conflicts:
  - Registering an email that is already registered.
  - Recording a transaction for a property that is already `Sold`.
  - Deleting a property that has linked financial transaction history.
  - Booking an appointment that conflicts with an agent's existing confirmed tour (caught via row-level lock on Agent entity).
