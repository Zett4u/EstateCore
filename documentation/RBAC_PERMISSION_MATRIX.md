# EstateCore — Role-Based Access Control (RBAC) Permission Matrix

## 1. System Role Definitions

| Role | Domain Scope | Primary Responsibilities |
| :--- | :--- | :--- |
| **PUBLIC** | Anonymous Visitor | Browsing landing page, public property catalog, property specifications, about, and contact pages. |
| **CLIENT** | Prospective Buyer / Tenant | Managing personal profile, submitting inquiries, scheduling viewing tours, tracking their own inquiries and appointments. |
| **AGENT** | Licensed Real Estate Broker | Managing assigned property listings, creating new listings, responding to assigned prospect inquiries, confirming/conducting viewing appointments. |
| **ADMIN** | System / Brokerage Administrator | Full operational oversight: user management, agent account creation/deactivation, listing reassignment, system-wide inquiry and appointment management. |

---

## 2. Complete REST Endpoint Permission Matrix

| Endpoint | Method | Allowed Roles | Ownership & Business Rules | Expected Success | Expected Denial |
| :--- | :---: | :--- | :--- | :---: | :---: |
| `/api/auth/register` | `POST` | `PUBLIC` | Open registration. Server strictly forces `role = CLIENT`. | `201 Created` | `400 Bad Request` (Validation) / `409 Conflict` (Email in use) |
| `/api/auth/login` | `POST` | `PUBLIC` | Validates email & hashed password via bcrypt. Returns signed JWT. | `200 OK` | `401 Unauthorized` |
| `/api/auth/me` | `GET` | `CLIENT`, `AGENT`, `ADMIN` | Returns profile of the authenticated user from the validated JWT payload. | `200 OK` | `401 Unauthorized` (Missing/Invalid Token) |
| `/api/users` | `GET` | `ADMIN` | System user directory with optional filtering by role and active status. | `200 OK` | `401 Unauthorized` / `403 Forbidden` |
| `/api/users/:id` | `GET` | `ADMIN`, `AGENT`, `CLIENT` | Self-only for `CLIENT` and `AGENT` (`id === user.id`). `ADMIN` can view any user. | `200 OK` | `401 Unauthorized` / `403 Forbidden` (`id !== user.id`) / `404 Not Found` |
| `/api/users/:id` | `PATCH` | `ADMIN`, `AGENT`, `CLIENT` | Non-admins can only update their own profile; `role` and `isActive` are stripped unless `ADMIN`. | `200 OK` | `401 Unauthorized` / `403 Forbidden` / `409 Conflict` (Email taken) |
| `/api/users/:id` | `DELETE` | `ADMIN` | Safely deactivates account (`isActive = false`) to protect historical relational integrity. | `200 OK` | `401 Unauthorized` / `403 Forbidden` |
| `/api/properties` | `GET` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Public catalog search with filters (type, listing, price range, status). | `200 OK` | N/A (Publicly readable) |
| `/api/properties/:id` | `GET` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Detailed property dossier with agent bio and specifications. | `200 OK` | `404 Not Found` |
| `/api/properties` | `POST` | `ADMIN`, `AGENT` | `AGENT` is forced as `agentId = user.id`. `ADMIN` can assign any valid agent. | `201 Created` | `401 Unauthorized` / `403 Forbidden` (Clients rejected) |
| `/api/properties/:id` | `PATCH` | `ADMIN`, `AGENT` | `ADMIN` can update any property. `AGENT` can only update properties assigned to them (`property.agentId === user.id`). | `200 OK` | `401 Unauthorized` / `403 Forbidden` (Clients & other agents rejected) |
| `/api/properties/:id` | `DELETE` | `ADMIN`, `AGENT` | `ADMIN` can delete any property. `AGENT` can only delete properties assigned to them. | `200 OK` | `401 Unauthorized` / `403 Forbidden` |
| `/api/inquiries` | `GET` | `CLIENT`, `AGENT`, `ADMIN` | `CLIENT` sees only their own inquiries (`clientId = user.id`). `AGENT` sees only inquiries on their properties (`assignedAgentId = user.id`). `ADMIN` sees all. | `200 OK` | `401 Unauthorized` |
| `/api/inquiries/:id` | `GET` | `CLIENT`, `AGENT`, `ADMIN` | `CLIENT` can only view if `clientId === user.id`. `AGENT` can only view if `assignedAgentId === user.id`. `ADMIN` can view any. | `200 OK` | `401 Unauthorized` / `403 Forbidden` (IDOR blocked) |
| `/api/inquiries` | `POST` | `CLIENT`, `AGENT`, `ADMIN` | Submits property inquiry. Server strictly enforces `clientId = user.id` from JWT. | `201 Created` | `401 Unauthorized` / `404 Not Found` (Property missing) |
| `/api/inquiries/:id` | `PATCH` | `CLIENT`, `AGENT`, `ADMIN` | `CLIENT` can only edit message/phone while `PENDING`. `AGENT` can update status. `ADMIN` can reassign agent. Other users blocked. | `200 OK` | `401 Unauthorized` / `403 Forbidden` |
| `/api/inquiries/:id` | `DELETE` | `ADMIN`, `CLIENT` | `CLIENT` can only delete their own inquiry. `AGENT` cannot delete inquiries unless `ADMIN`. | `200 OK` | `401 Unauthorized` / `403 Forbidden` |
| `/api/appointments` | `GET` | `CLIENT`, `AGENT`, `ADMIN` | `CLIENT` sees only their appointments (`clientId = user.id`). `AGENT` sees only their assigned tours (`agentId = user.id`). `ADMIN` sees all. | `200 OK` | `401 Unauthorized` |
| `/api/appointments/:id` | `GET` | `CLIENT`, `AGENT`, `ADMIN` | `CLIENT` viewable only if `clientId === user.id`. `AGENT` viewable only if `agentId === user.id`. `ADMIN` viewable for all. | `200 OK` | `401 Unauthorized` / `403 Forbidden` (IDOR blocked) |
| `/api/appointments` | `POST` | `CLIENT`, `AGENT`, `ADMIN` | Creates viewing tour request. Prevents past dates and agent scheduling conflicts. Enforces `clientId = user.id`. | `201 Created` | `400 Bad Request` (Past date) / `409 Conflict` (Slot booked) |
| `/api/appointments/:id` | `PATCH` | `CLIENT`, `AGENT`, `ADMIN` | `CLIENT` can only change status to `CANCELLED`. `AGENT` and `ADMIN` can confirm/complete. Conflict check enforced on date/time change. | `200 OK` | `401 Unauthorized` / `403 Forbidden` (Client approval attempt) |
| `/api/appointments/:id` | `DELETE` | `ADMIN`, `CLIENT` | `CLIENT` can delete their own appointment request. `AGENT` cannot delete appointment records (must mark `CANCELLED`). | `200 OK` | `401 Unauthorized` / `403 Forbidden` |

---

## 3. Frontend Route Permission Matrix

| Route Path | Associated Page Component | Permitted Roles | Unauthorized Action / Failure Mode |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Open access for all visitors |
| `/properties` | `PropertiesList` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Open catalog access for all visitors |
| `/properties/:id` | `PropertyDetail` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Open details access; action buttons adapt to login state |
| `/about` | `AboutPage` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Open access |
| `/contact` | `ContactPage` | `PUBLIC`, `CLIENT`, `AGENT`, `ADMIN` | Open access |
| `/login` | `Login` | `PUBLIC` | Authenticated users redirected to their respective dashboard |
| `/register` | `Register` | `PUBLIC` | Authenticated users redirected to `/client` |
| `/admin` | `AdminDashboard` | `ADMIN` only | Non-admins redirected to their authorized dashboard |
| `/users` | `UsersList` | `ADMIN` only | Non-admins redirected to their authorized dashboard |
| `/agent` | `AgentDashboard` | `AGENT` only | Non-agents redirected to their authorized dashboard |
| `/properties/new` | `PropertyForm` | `ADMIN`, `AGENT` | Clients redirected to `/client` |
| `/properties/:id/edit`| `PropertyForm` | `ADMIN`, `AGENT` (Ownership verified) | Non-owner agents proactively redirected to `/properties` |
| `/client` | `ClientDashboard` | `CLIENT` only | Admins/Agents redirected to their authorized dashboard |
| `/inquiries` | `InquiriesList` | `ADMIN`, `AGENT`, `CLIENT` | Scope strictly filtered by backend JWT |
| `/appointments` | `AppointmentsList` | `ADMIN`, `AGENT`, `CLIENT` | Scope strictly filtered by backend JWT |
| `/profile` | `UserProfile` | `ADMIN`, `AGENT`, `CLIENT` | Self-profile update only |
