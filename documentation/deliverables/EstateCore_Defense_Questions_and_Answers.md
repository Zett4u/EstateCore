# ESTATECORE — DEFENSE QUESTIONS AND ANSWERS (Q&A)
## Panel Defense & Technical Evaluation Reference

**Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student:** Cabico, Cristina O. | BSIT 4-C  
**Project:** EstateCore Real Estate Management System  

---

### Q1: Why did you choose NestJS over Express.js for the backend?
**Answer:**  
*"While Express.js is lightweight, it is unopinionated and lacks built-in architectural structure, which often leads to maintainability issues in enterprise systems. NestJS provides a robust, modular architectural pattern heavily inspired by Angular. It provides native support for TypeScript, Dependency Injection, declarative validation via DTOs and decorators, standardized exception filters, and first-class integration with TypeORM. This modular design makes systems integration clean, scalable, and readily testable."*

---

### Q2: How did you handle the requirement of minimum 20 endpoints?
**Answer:**  
*"While the final project mandate requires a minimum of 20 endpoints, EstateCore implements and verifies **39 working REST endpoints** across 7 domain controllers: Auth (4), Users (6), Agents (5), Properties (11), Inquiries (5), Appointments (5), and Transactions (3). Every endpoint adheres to standard RESTful conventions using GET, POST, PUT, PATCH, and DELETE under our canonical `/api/v1` prefix."*

---

### Q3: What is the difference between PUT and PATCH in your API?
**Answer:**  
*"PUT is designed for full replacement updates. When a client sends a PUT request to `/api/v1/properties/:id`, they must supply the complete property payload, replacing all attributes. PATCH is designed for partial updates: when updating just the price or status of a property, the client sends only those specific fields without resending the entire entity body."*

---

### Q4: How does EstateCore prevent race conditions and double-selling of properties?
**Answer:**  
*"We implement atomic transaction concurrency control in `TransactionsService` using TypeORM's `dataSource.transaction`. Inside the transaction, we acquire a pessimistic write lock using `.setLock('pessimistic_write')` which translates to MySQL's `SELECT ... FOR UPDATE`. This row-level lock ensures that during transaction processing, no other thread or request can read or modify the property row until the transaction commits. If the property status is already `SOLD`, the system immediately aborts the operation and returns HTTP 409 Conflict."*

---

### Q5: How do you handle Broken Object-Level Authorization (BOLA)?
**Answer:**  
*"BOLA, formerly known as Insecure Direct Object References (IDOR), occurs when a user modifies resources they do not own. We prevent this by enforcing contextual ownership checks inside our service layer. For example, when an Agent attempts to update a property via `PATCH /properties/:id`, the service verifies that `property.agentId` matches the authenticated user's `agentId`. If there is a mismatch, the server throws an HTTP 403 ForbiddenException."*

---

### Q6: How does token revocation work with stateless JWTs?
**Answer:**  
*"By default, JWTs are stateless and remain valid until their expiration timestamp. In EstateCore, we combine stateless verification with an in-memory revocation blacklist service (`TokenBlacklistService`). When a user calls `/auth/logout`, the token signature is extracted and stored in a blacklist cache with a TTL matching the token's remaining lifespan. During every subsequent request, the `JwtAuthGuard` checks whether the token is in the blacklist; if found, it immediately denies access with HTTP 401 Unauthorized."*

---

### Q7: Why is `ON DELETE CASCADE` used for photos but `ON DELETE RESTRICT` for inquiries?
**Answer:**  
*"This reflects real-world business and legal constraints. A property's photos are dependent child assets: if a listing is permanently deleted, its photos have no independent purpose and should be automatically cleaned up (`CASCADE`). Conversely, client inquiries represent historical correspondence, negotiations, and financial intent. Using `ON DELETE RESTRICT` prevents accidental deletion of properties or user accounts that have active inquiry audit trails, ensuring historical traceability."*

---

### Q8: How did you ensure the security of file uploads?
**Answer:**  
*"Our photo upload pipeline incorporates four defensive layers: First, MIME-type and extension whitelisting restricted strictly to `image/jpeg`, `image/png`, `image/webp`, and `image/gif`. Second, file size enforcement capping uploads at 5MB. Third, path traversal sanitization preventing directory breakout characters (`..`) and null bytes (`\0`). Fourth, safe randomized filenames using timestamps and cryptographic random hex bytes to prevent overwriting or guessing existing files."*

---

### Q9: How do you ensure that live production database `estatecore_db` was not modified during testing?
**Answer:**  
*"All development, migration testing, rollback verification, and automated test suites strictly target the sandbox database `estatecore_test_restore` on MySQL port 3307. We authored an independent audit script `scripts/audit_live_database_isolation.js` that inspects `estatecore_db`, verifying its migration history, row counts, and schema fingerprints before and after each phase to confirm 100% zero-touch isolation."*

---

### Q10: Why is there zero SMS functionality in EstateCore?
**Answer:**  
*"In strict alignment with the course directives and architectural scope boundaries, EstateCore is designed exclusively with Email notification pipelines. We deliberately excluded cellular gateways, SMS libraries, and SMS templates to prevent unnecessary infrastructure complexity and vendor dependencies."*
