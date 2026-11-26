# EstateCore Developer Guide: Academic Requirements Traceability Matrix

**Project:** EstateCore — Real Estate Management System  
**Academic References:**  
1. `estatecire.pdf` — BSIT 4-C Laboratory Activities 03, 04, 05, and 06  
2. `09_Final_Project_Student_Copy.pdf` — ITEC 116 Final Project Guidelines & Deliverables  
**Instructor:** John Vincent A. Dallego, MIT  
**Student Developer:** Cabico, Cristina O. (BSIT 4-C)  

---

## 1. Traceability Methodology & Status Classifications

To ensure academic rigor, each requirement is evaluated against live code and automated tests using the following strict classifications:
- **IMPLEMENTED & TESTED:** Code exists, executes live, and has automated passing test assertions.
- **IMPLEMENTED & AUDITED:** Production code and schema exist and are verified by static/dynamic inspection.
- **DELIVERABLE VERIFIED:** Deliverable file exists, is non-empty, and has been verified (e.g. SQL clean import test).
- **OUTSTANDING MANUAL TASK:** An action item requiring human execution (e.g. recording the student presentation video).

---

## 2. Laboratory Activity 03: System Architecture & Components (`estatecire.pdf`, p. 1–3)

| Requirement ID | Specification from Handout | Implementation File(s) | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **L03-01** | User Roles: Buyer/Renter, Seller, Agent, Admin | `role.enum.ts`, `user.entity.ts` | 3 Canonical roles (`ADMIN`, `AGENT`, `CLIENT`) with Client modeling both Buyer/Renter and Property Owner | **IMPLEMENTED & TESTED** |
| **L03-02** | Web Client Application | `frontend/src/App.tsx` | React 18 + Vite + Tailwind CSS SPA; 21/21 Playwright tests pass | **IMPLEMENTED & TESTED** |
| **L03-03** | Application Server | `backend/src/main.ts` | NestJS 10.4 REST API running on port 3000 bound to `0.0.0.0` | **IMPLEMENTED & TESTED** |
| **L03-04** | Database Server | `app.module.ts`, `docker-compose.yml` | MySQL 8.4 LTS in Docker container on host port 3307 | **IMPLEMENTED & TESTED** |
| **L03-05** | Email Notification Service | `backend/src/` | Email notification logging policy active | **IMPLEMENTED & AUDITED** |
| **L03-06** | SMS Notification Mandate | `package.json` | Zero cellular/SMS API dependencies, adhering to Lab 06 (p. 28) Email-Only policy | **IMPLEMENTED & AUDITED** |
| **L03-07** | Information Flow Architecture | `app.module.ts` | 3-tier flow: Web Client -> REST API -> MySQL Database -> Response | **IMPLEMENTED & TESTED** |

---

## 3. Laboratory Activity 04: Database Design & Entity Relationships (`estatecire.pdf`, p. 1–5)

| Requirement ID | Specification from Handout | Implementation File(s) | Database Entity / Constraint | Status |
| :--- | :--- | :--- | :--- | :--- |
| **L04-01** | User Entity | `user.entity.ts` | `users` table: id, email, password, role, firstName, lastName, contactNumber, isActive | **IMPLEMENTED & TESTED** |
| **L04-02** | Agent Entity (1:1 with User) | `agent.entity.ts` | `agents` table: id, userId (FK -> users.id, CASCADE), licenseNumber, agencyName, bio | **IMPLEMENTED & TESTED** |
| **L04-03** | Property Entity | `property.entity.ts` | `properties` table: id, title, price, bedrooms, bathrooms, floorArea, lotArea, agentId, ownerId | **IMPLEMENTED & TESTED** |
| **L04-04** | PropertyPhoto Entity | `property-photo.entity.ts` | `property_photos` table: id, propertyId (FK -> properties.id, CASCADE), photoUrl, isPrimary | **IMPLEMENTED & TESTED** |
| **L04-05** | Inquiry Entity | `inquiry.entity.ts` | `inquiries` table: id, propertyId (RESTRICT), clientId (RESTRICT), offerPrice, status | **IMPLEMENTED & TESTED** |
| **L04-06** | PropertyTransaction Entity | `transaction.entity.ts` | `property_transactions` table: id, propertyId (RESTRICT), buyerId, agentId, finalPrice | **IMPLEMENTED & TESTED** |
| **L04-07** | Appointments Module | `appointment.entity.ts` | `appointments` table: id, propertyId, clientId, agentId, appointmentDate, status | **IMPLEMENTED & TESTED** |
| **L04-08** | Foreign Key Integrity | 7 Entity files | 13 foreign keys enforced in MySQL InnoDB engine with RESTRICT on inquiries & deals | **IMPLEMENTED & TESTED** |
| **L04-09** | Identity Disambiguation | Entities & Services | Strict separation of `users.id` vs `agents.id`; resolved via `agents.userId` | **IMPLEMENTED & TESTED** |

---

## 4. Laboratory Activity 05: RESTful API Specifications (`estatecire.pdf`, p. 6–31)

| Card | Required Endpoint | Method | Implementation Controller | Test ID & Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Card 01 | `/api/v1/users` | `POST` | `UsersController.create` | `EP-08` (201 Created) | **IMPLEMENTED & TESTED** |
| Card 02 | `/api/v1/users/:id` | `GET` | `UsersController.findOne` | `EP-09` (200 OK / 403 BOLA) | **IMPLEMENTED & TESTED** |
| Card 03 | `/api/v1/agents` | `GET` | `AgentsController.findAll` | `EP-13` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 04 | `/api/v1/properties` | `GET` | `PropertiesController.findAll` | `EP-18` (200 OK with filters) | **IMPLEMENTED & TESTED** |
| Card 05 | `/api/v1/properties/:id` | `GET` | `PropertiesController.findOne` | `EP-19` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 06 | `/api/v1/properties` | `POST` | `PropertiesController.create` | `EP-20` (201 Created) | **IMPLEMENTED & TESTED** |
| Card 07 | `/api/v1/properties/:id` | `PUT` | `PropertiesController.updatePut` | `EP-22` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 08 | `/api/v1/properties/:id` | `PATCH` | `PropertiesController.updatePatch` | `EP-21` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 09 | `/api/v1/agents/:id` | `GET` | `AgentsController.findOne` | `EP-14` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 10 | `/api/v1/agents` | `POST` | `AgentsController.create` | `EP-15` (201 Created) | **IMPLEMENTED & TESTED** |
| Card 11 | `/api/v1/agents/:id` | `PATCH` | `AgentsController.updatePatch` | `EP-16` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 12 | `/api/v1/properties/:id` | `DELETE` | `PropertiesController.remove` | `EP-28` (409 on transaction conflict) | **IMPLEMENTED & TESTED** |
| Card 13 | `/api/v1/properties/:id/photos` | `GET` | `PropertiesController.getPhotos` | `EP-24` (200 OK) | **IMPLEMENTED & TESTED** |
| Card 14 | `/api/v1/properties/:id/photos` | `POST` | `PropertiesController.addPhoto` | `EP-23` (201 Created / 400 empty) | **IMPLEMENTED & TESTED** |
| Card 15 | `/api/v1/properties/:id/inquiries` | `POST` | `PropertiesController.createInquiry` | `EP-25` (201 Created with offerPrice) | **IMPLEMENTED & TESTED** |
| Card 16 | `/api/v1/properties/:id/inquiries` | `GET` | `PropertiesController.getInquiries` | `EP-26` (200 OK assigned agent only) | **IMPLEMENTED & TESTED** |
| Card 17 | `/api/v1/properties/:id/inquiries/:inquiryId` | `PATCH` | `PropertiesController.updateInquiry` | `EP-27` (200 OK status update) | **IMPLEMENTED & TESTED** |
| Card 18 | `/api/v1/transactions` | `POST` | `TransactionsController.create` | `EP-39` (201 Created, sets SOLD) | **IMPLEMENTED & TESTED** |
| Card 19 | `/api/v1/transactions/:id` | `GET` | `TransactionsController.findOne` | `EP-41` (200 OK / 403 BOLA) | **IMPLEMENTED & TESTED** |

---

## 5. Laboratory Activity 06: Authentication, RBAC & Security (`estatecire.pdf`, p. 20–28)

| Requirement | Handout Specification | Implementation File(s) | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Password Hashing** | Bcrypt with salt rounds &ge; 10 | `auth.service.ts` | Passwords stored starting with `$2a$10$` | **IMPLEMENTED & TESTED** |
| **JWT Lifespan** | Strictly 1 hour (3600 seconds) | `auth.module.ts`, `.env.example` | `JWT_EXPIRATION=3600s`, verified in token `exp` claim | **IMPLEMENTED & TESTED** |
| **Agent Token Claim** | Token embeds `agentId` claim | `auth.service.ts` | Decoded agent JWT contains `agentId: 1` | **IMPLEMENTED & TESTED** |
| **Token Revocation** | Server-side logout blacklist | `token-blacklist.service.ts` | `POST /auth/logout` invalidates session token | **IMPLEMENTED & TESTED** |
| **Rate Limiting** | 5-Attempt brute-force lockout | `auth.service.ts` | 5 failed logins triggers `429 Too Many Requests` | **IMPLEMENTED & TESTED** |
| **BOLA Defense** | Broken object level authorization | Services & Controllers | Cross-agent/client access returns `403 Forbidden` | **IMPLEMENTED & TESTED** |
| **Pessimistic Lock** | Concurrency race condition defense | `transactions.service.ts` | `setLock('pessimistic_write')` verified in race test | **IMPLEMENTED & TESTED** |
| **Upload Security** | 5MB limit, whitelist, path defense | `properties.controller.ts` | Rejects non-image, path traversal `../`, >5MB | **IMPLEMENTED & TESTED** |
| **Notification Policy** | Email-only mandate (p. 28) | Codebase scan | Zero SMS/Twilio dependencies; email logging exclusively | **IMPLEMENTED & AUDITED** |

---

## 6. ITEC 116 Final Project Core Criteria (`09_Final_Project_Student_Copy.pdf`)

| Requirement | Required Standard | Audited Implementation | Compliance |
| :--- | :--- | :--- | :--- |
| **Minimum 20 Endpoints** | $\ge 20$ REST Endpoints | **39 Endpoints** across 7 controllers | **EXCEEDED (+95%)** |
| **Additional CRUD Modules** | $\ge 2$ Modules beyond Auth | **6 Modules** (Properties, Inquiries, Appointments, Users, Agents, Transactions) | **EXCEEDED (+200%)** |
| **Database Management** | MySQL with TypeORM | MySQL 8.4 on Port 3307; TypeORM 0.3 data mappers | **100% COMPLIANT** |
| **SQL Database Export** | Working `.sql` dump file | `documentation/deliverables/EstateCore_Final_Project.sql` (18.1 KB, verified clean import) | **DELIVERABLE VERIFIED** |
| **Postman API Collection** | Complete executable collection | `documentation/deliverables/EstateCore_Final_Project.postman_collection.json` (40.3 KB, 46 requests) | **DELIVERABLE VERIFIED** |
| **Postman Environment** | Pre-configured environment | `documentation/deliverables/EstateCore_Postman_Environment.template.json` (1.0 KB) | **DELIVERABLE VERIFIED** |
| **Technical Documentation** | Comprehensive PDF document | `documentation/deliverables/EstateCore_Final_Project_Documentation.pdf` (641.9 KB, 28 pages) | **DELIVERABLE VERIFIED** |
| **Presentation Deck** | Professional slides | `documentation/deliverables/EstateCore_Final_Project_Presentation.pptx` (187.4 KB, 15 slides) | **DELIVERABLE VERIFIED** |
| **Demonstration Script** | 5–10-minute demo script | `documentation/deliverables/EstateCore_5_to_10_Minute_Demo_Script.md` (7.6 KB, timed 8-minute script) | **DELIVERABLE VERIFIED** |
| **Defense Preparation** | Defense questions & answers | `documentation/deliverables/EstateCore_Defense_Questions_and_Answers.md` (5.8 KB, 10 technical Q&As) | **DELIVERABLE VERIFIED** |
| **Demonstration Video** | 5–10-minute narrated video (`.mp4`) | Script and slides prepared; video recording must be performed by student | **OUTSTANDING MANUAL TASK** |
