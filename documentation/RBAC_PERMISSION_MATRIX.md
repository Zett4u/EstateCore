# EstateCore — Role-Based Access Control (RBAC) & Ownership Matrix (Revised)
### Verified Security Architecture Aligned with `estatecire.pdf` Laboratory Activities 05 & 06

This matrix defines the authoritative access rules, ownership boundaries, and HTTP response codes across all system endpoints, directly derived from `estatecire.pdf` (Lab 05 Endpoint Summary Table, pp. 10–11; Lab 06 Access Control Matrix, pp. 21–23).

---

## 1. Role Reconciliation & Persona Mapping

The PDF defines six conceptual roles across the platform. Below is the precise operational mapping to the database and JWT authentication layer:

| PDF Persona | Database `Role` Value | Runtime Identity | JWT Token Claims (`Lab 06, p. 4`) | Permissions & Business Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Guest** | *(None)* | Unauthenticated visitor (`No JWT`) | None | Public discovery. Can browse public property listings, photos, agent directory, and register an account. |
| **Buyer / Renter** | `Buyer` / `Renter` *(or legacy `CLIENT`)* | Registered consumer | `{"sub": "userId", "role": "Buyer"}` | Can submit inquiries and price offers, schedule and cancel personal viewing appointments, and view own deals. |
| **Seller / PropertyManager** | `Seller` / `PropertyManager` | Registered property owner | `{"sub": "userId", "role": "Seller"}` | Legal asset deed holder linked via `Property.OwnerID`. Can review representation status and transactions on their properties. |
| **Agent** | `Agent` *(or legacy `AGENT`)* | Licensed real estate professional | `{"sub": "userId", "role": "Agent", "agentId": 3}` | Must possess an active 1:1 `Agent` record (`LicenseNumber`). Represents listings, conducts tours, replies to inquiries, and creates transactions. |
| **Admin** | `Admin` *(or legacy `ADMIN`)* | System Administrator | `{"sub": "userId", "role": "Admin"}` | Full governance. User administration, dispute resolution, global inquiries oversight, and property archiving. |

### Registration & Privilege Elevation Rules:
1. **Public Registration (`POST /api/v1/users`)**: Only allows self-registration as consumer roles (`Buyer`, `Renter`, `Seller`). Any payload attempting to supply `role: "Agent"` or `role: "Admin"` is strictly rejected with `400 Bad Request`.
2. **Agent Onboarding**: An `Agent` profile row can only be provisioned by an `Admin` or through a verified administrative agent-onboarding workflow (`POST /api/v1/agents`).
3. **Immutability of Role on Self-Profile Update (`PATCH /api/v1/users/{id}`)**: Users may update their name or contact number, but any attempt to alter their own `role` is rejected with `403 Forbidden`. Only an Admin can alter account roles.

---

## 2. Definitive Endpoint Access Control Matrix (Lab 05 & Lab 06)

| # | HTTP Method | Endpoint URI (`/api/v1` base) | Guest | Buyer / Renter | Seller / Manager | Agent | Admin | Ownership & Access Rule (`Lab 06, p. 4`) | Success Code | Denial Codes |
| :- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **1** | `POST` | `/users` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public account registration (creates `Buyer`/`Renter`/`Seller`). | `201 Created` | `400`, `409` |
| **2** | `GET` | `/users/{id}` | **No** | **Own** | **Own** | **Own** | **Yes** | Authenticated. Only self (`sub === id`) or Admin can view profile. | `200 OK` | `401`, `403`, `404` |
| **3** | `PATCH` | `/users/{id}` | **No** | **Own** | **Own** | **Own** | **No** | Authenticated. Only self can update personal fields. Role immutable. | `200 OK` | `400`, `401`, `403`, `404` |
| **4** | `DELETE`| `/users/{id}` | **No** | **No** | **No** | **No** | **Yes** | Admin only. Removes or deactivates user account. | `204 No Content`| `401`, `403`, `404` |
| **5** | `GET` | `/agents` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public directory of licensed agents (paginated). | `200 OK` | `400` |
| **6** | `POST` | `/agents` | **No** | **No** | **No** | **Yes** | **No** | Authenticated (`Agent` role). Creates verified agent profile with license. | `201 Created` | `400`, `401`, `409` |
| **7** | `GET` | `/properties` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public catalog search, multi-field filters, and pagination. | `200 OK` | `400` |
| **8** | `GET` | `/properties/{id}` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public single property architectural dossier. | `200 OK` | `404` |
| **9** | `POST` | `/properties` | **No** | **No** | **No** | **Yes** | **No** | Agent only. `agentId` automatically populated from JWT claims. | `201 Created` | `400`, `401`, `403` |
| **10**| `PUT` | `/properties/{id}` | **No** | **No** | **No** | **Own** | **No** | Agent (own listing only). Replaces entire listing resource. | `200 OK` | `400`, `401`, `403`, `404` |
| **11**| `PATCH` | `/properties/{id}` | **No** | **No** | **No** | **Own** | **No** | Agent (own listing only). Updates selected fields (e.g. status). | `200 OK` | `400`, `401`, `403`, `404` |
| **12**| `DELETE`| `/properties/{id}` | **No** | **No** | **No** | **Own** | **Yes** | Agent (own listing) or Admin. Denied if transactions exist (`409`). | `204 No Content`| `401`, `403`, `404`, `409` |
| **13**| `GET` | `/properties/{id}/photos` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | Public photo gallery of listing. | `200 OK` | `404` |
| **14**| `POST` | `/properties/{id}/photos` | **No** | **No** | **No** | **Own** | **No** | Agent (own listing only). Attaches photo record to listing. | `201 Created` | `400`, `401`, `403`, `404` |
| **15**| `POST` | `/properties/{id}/inquiries` | **No** | **Yes** | **No** | **No** | **No** | Buyer or Renter only. Submits inquiry or price offer (`OfferAmount > 0`). | `201 Created` | `400`, `401`, `404` |
| **16**| `GET` | `/properties/{id}/inquiries` | **No** | **No** | **No** | **Own** | **No** | Agent (own listing only). Retrieves inquiries submitted on this property. | `200 OK` | `401`, `403`, `404` |
| **17**| `PATCH` | `/properties/{id}/inquiries/{inquiryId}` | **No** | **No** | **No** | **Own** | **No** | Agent (own listing only). Updates status (`Accepted`, `Rejected`, `Replied`). | `200 OK` | `400`, `401`, `403`, `404` |
| **18**| `POST` | `/transactions` | **No** | **No** | **No** | **Yes** | **No** | Agent only. Records sale/rental deal. Verifies property is available. | `201 Created` | `400`, `401`, `403`, `404`, `409` |
| **19**| `GET` | `/transactions/{id}` | **No** | **Own** | **No** | **Own** | **No** | Only the Buyer involved or the Handling Agent can inspect deal. | `200 OK` | `401`, `403`, `404` |

---

## 3. Supporting Module: Viewing Appointments (EstateCore Extension)

| # | HTTP Method | Endpoint URI | Guest | Buyer / Renter | Seller / Manager | Agent | Admin | Ownership & Conflict Rules | Success Code | Denial Codes |
| :- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **20**| `POST` | `/appointments` | **No** | **Yes** | **No** | **No** | **No** | Buyer/Renter schedules tour. Enforces future date and no agent overlap. | `201 Created` | `400`, `401`, `409` |
| **21**| `GET` | `/appointments` | **No** | **Own** | **No** | **Own** | **Yes** | Buyers view own booked tours; Agents view tours assigned to them. | `200 OK` | `401`, `403` |
| **22**| `PATCH`| `/appointments/{id}` | **No** | **Own** | **No** | **Own** | **Yes** | Client may cancel (`CANCELLED`). Agent confirms (`CONFIRMED`). | `200 OK` | `400`, `401`, `403`, `404` |

---

## 4. Exact Failure Protocol

- **`401 Unauthorized`**: Returned when `Authorization: Bearer <token>` is missing, malformed, or expired.
- **`403 Forbidden`**: Returned when the user is authenticated, but:
  - Lacks the required role (e.g., Buyer calling `POST /properties`, which is for Agents only).
  - Fails the ownership check (e.g., Agent 3 attempting to edit a listing or view an inquiry belonging to Agent 2; or Client A viewing Client B's inquiry).
  - Attempts privilege escalation (e.g., non-admin attempting to change their own role in `PATCH /users/{id}`).
- **`404 Not Found`**: Returned when the target resource ID does not exist in MySQL.
- **`409 Conflict`**: Returned on state or uniqueness conflicts:
  - Registering an email that is already registered.
  - Recording a transaction for a property that is already `Sold`.
  - Deleting a property that has linked financial transaction history.
  - Booking an appointment that conflicts with an agent's existing confirmed tour.
