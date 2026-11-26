# ESTATECORE — 5 TO 10 MINUTE SYSTEM DEMONSTRATION SCRIPT
## Oral Defense & Video Walkthrough Guide

**Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student Presenter:** Cabico, Cristina O.  
**Class Section:** BSIT 4-C  
**Project Name:** EstateCore Real Estate Management System  
**Target Time:** 7 Minutes 30 Seconds (Within the mandated 5–10 minute requirement)  

---

## TIMELINE & MINUTE-BY-MINUTE SCRIPT

### Phase 1: Introduction & Project Identification (0:00 – 1:00)
**Visual on Screen:** Title Slide / Application Welcome Banner.

> **Spoken Script:**  
> *"Good day, Sir John Vincent Dallego and members of the evaluation panel. I am Cristina O. Cabico from BSIT 4-C, and today I am honored to present the completed, fully integrated backend and frontend implementation of our final project in ITEC 116: Systems Integration and Architecture 2 — the EstateCore Real Estate Management System.*  
>  
> *EstateCore is an enterprise-grade real estate platform designed to streamline property catalog management, professional broker attributions, client inquiries, viewing appointments, and financial sales settlements.*  
>  
> *In today's walkthrough, I will demonstrate how EstateCore fulfills and exceeds all academic requirements, featuring 39 functional REST endpoints across 7 controllers, strict Role-Based Access Control, MySQL relational persistence with TypeORM, and atomic transaction concurrency control."*

---

### Phase 2: System Integration Architecture & Tech Stack (1:00 – 2:15)
**Visual on Screen:** 3-Tier Layered Architecture Diagram / Codebase structure in VS Code.

> **Spoken Script:**  
> *"EstateCore is architected around a strict multi-tier systems integration model.*  
>  
> *At the Presentation Tier, we have a reactive Single Page Application built using React 18, Vite, and Tailwind CSS. The client communicates with the backend via Axios with centralized authentication interceptors.*  
>  
> *At the Application Tier, we chose NestJS 10 with TypeScript. We leveraged NestJS's modular architecture, dividing the domain into seven distinct feature modules: Auth, Users, Agents, Properties, Inquiries, Appointments, and Transactions. Each module encapsulates its own controllers, services, DTOs with class-validator validation, and TypeORM entities.*  
>  
> *At the Data Tier, our persistence layer runs on MySQL 8.4 Enterprise in a containerized Docker environment on port 3307. We strictly utilize TypeORM with database migrations and maintain complete isolation between our active sandbox testing database and production."*

---

### Phase 3: Authentication & Security Architecture Demo (2:15 – 3:45)
**Visual on Screen:** Login UI, JWT token inspection in DevTools, and `/auth/logout` execution.

> **Spoken Script:**  
> *"Now let's examine Authentication and Security.*  
>  
> *EstateCore implements stateless JSON Web Token authentication using HMAC-SHA256 signatures. In strict compliance with Lab 06 requirements, our access tokens are configured with an exact 1-hour expiration lifespan (3600 seconds).*  
>  
> *Let's log in as our licensed agent, Maria Santos, using `maria.santos@estatecore.local`. Notice upon successful login, the server returns an access token containing the user's role and their corresponding `agentId` claim.*  
>  
> *Security is reinforced with server-side token revocation: when a user clicks 'Log Out', the server places the token signature into an in-memory TTL blacklist. If an attacker attempts to reuse that token, the server immediately rejects the request with HTTP 401 Unauthorized.*  
>  
> *Furthermore, our login endpoint is protected by an in-memory rate limiter that returns HTTP 429 Too Many Requests after five consecutive failed login attempts."*

---

### Phase 4: Core CRUD Modules Demonstration (3:45 – 5:30)
**Visual on Screen:** Property listings catalog, creating a listing, uploading a photo, and submitting an inquiry.

> **Spoken Script:**  
> *"The final project requires at least two functional CRUD modules beyond authentication. EstateCore provides six complete CRUD modules. Let's demonstrate Properties and Inquiries.*  
>  
> *First, in the Properties module, users can publicly browse, search, and filter listings by property type, listing type, and price range. As an agent, Maria Santos can create a new condominium listing. Watch as we input the property details: title, price, location, bedrooms, and floor area. When submitted via `POST /api/v1/properties`, the backend automatically attributes the listing to Maria's agent profile.*  
>  
> *Next, we upload a high-resolution photo. Our upload pipeline validates MIME types, enforces a 5MB size limit, sanitizes against path traversal attacks, and stores the photo securely.*  
>  
> *Now, switching over to client Juan Dela Cruz, Juan navigates to Maria's property and submits an inquiry: 'Is this unit available for viewing this Saturday?' The inquiry is persisted via `POST /api/v1/properties/:id/inquiries`. When Maria logs into her agent dashboard, she can view this inquiry, update its lifecycle status to 'CONTACTED', or schedule a confirmed viewing appointment on our calendar."*

---

### Phase 5: Database Concurrency & Double-Sale Prevention (5:30 – 6:45)
**Visual on Screen:** Terminal showing TypeORM transaction code and database records before/after sale.

> **Spoken Script:**  
> *"One of the most critical engineering challenges in real estate systems is transactional consistency. In EstateCore, when an acquisition occurs, we must guarantee that a property cannot be sold twice.*  
>  
> *Our `TransactionsService` executes within an atomic database transaction using pessimistic write locking (`PESSIMISTIC_WRITE`). When Maria records the sale settlement via `POST /api/v1/transactions`, the database locks the property row, records the audited financial transaction, and atomically transitions the property status to `SOLD`.*  
>  
> *If a second simultaneous request or subsequent attempt tries to execute a transaction on this property, our backend immediately detects that the property is already sold and rejects the operation with HTTP 409 Conflict. This prevents race conditions and guarantees 100% financial and relational integrity."*

---

### Phase 6: Postman Collection & Automated Test Suite (6:45 – 7:15)
**Visual on Screen:** Postman runner and terminal executing `scripts/test_final_project_36_endpoints.js`.

> **Spoken Script:**  
> *"To empirically validate our entire API, we built a comprehensive Postman Collection containing 46 requests across 8 categorized folders with pre-request scripts and automated status assertions.*  
>  
> *Furthermore, our automated backend verification suite executes 46 end-to-end tests covering all 39 REST endpoints, Role-Based Access Control, and negative error conditions — achieving an uncompromised 100% pass rate.*  
>  
> *In addition, our database export `EstateCore_Final_Project.sql` has been validated through a fresh import test, ensuring all seven tables, foreign keys, and seed records load with zero errors."*

---

### Phase 7: Conclusion & Defense Wrap-Up (7:15 – 7:30)
**Visual on Screen:** Closing Slide with Student Credentials and System Information.

> **Spoken Script:**  
> *"In conclusion, EstateCore represents a complete, secure, and production-tested real estate management solution that exceeds every benchmark of ITEC 116.*  
>  
> *Thank you very much, Sir Dallego, and I am now ready to answer any questions from the panel."*
