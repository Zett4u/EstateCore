# EstateCore — Real Estate Management System
### Full-Stack Systems Integration Enterprise Prototype (ITEC 116)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/NestJS-10.4-red.svg)]()
[![Database](https://img.shields.io/badge/MySQL-8.4_LTS-blue.svg)]()
[![Container](https://img.shields.io/badge/Docker-Compose-2496ED.svg)]()
[![Auth](https://img.shields.io/badge/Authentication-JWT_Passport-yellow.svg)]()
[![Frontend](https://img.shields.io/badge/React-18_Vite_Tailwind-61DAFB.svg)]()
[![REST API](https://img.shields.io/badge/REST_Endpoints-39_Mapped-informational.svg)]()
[![Final Project Tests](https://img.shields.io/badge/API_Verification-46%2F46_Passed-success.svg)]()
[![Playwright Tests](https://img.shields.io/badge/Playwright_E2E-21%2F21_Passed-success.svg)]()

---

## 1. Project Overview

**EstateCore** is a centralized, full-stack Real Estate Management Information System designed and implemented for **ITEC 116 (IT Elective 4: Systems Integration and Architecture 2)** under the supervision of **John Vincent A. Dallego, MIT**.

**Student Developer:** Cabico, Cristina O. (BSIT 4-C)  
**Academic References:** `estatecire.pdf` (Labs 03–06) & `09_Final_Project_Student_Copy.pdf` (ITEC 116 Final Project Guidelines)

The platform provides an enterprise architectural solution to streamline real estate operations: organizing property holdings, processing prospect inquiries, scheduling viewing appointments, executing atomic property sales with concurrency locking, and coordinating real estate advisors through a secured, role-guarded RESTful API and relational database.

### System Capabilities
- **39 Production REST API Endpoints:** Complete business coverage across 7 dedicated controllers: Authentication, Users Management, Agents Directory, Properties Catalog, Standalone & Nested Inquiries, Tour Appointments, and Financial Transactions.
- **Strict Role-Based Access Control (RBAC):** Server-side enforcement with zero trust for `ADMIN`, `AGENT`, and `CLIENT` roles, backed by ownership verification guards preventing Broken Object Level Authorization (BOLA/IDOR).
- **Concurrency & Double-Sale Defense:** Pessimistic write locking (`pessimistic_write`) within database transactions preventing race conditions during simultaneous property acquisitions.
- **Relational Integrity & History Retention:** MySQL InnoDB foreign key rules enforcing `RESTRICT` on properties with inquiries or settled transactions to protect audit trails from accidental cascaded deletion.
- **Dockerized Relational Persistence:** MySQL 8.4 LTS running in an isolated Docker container with named persistent volumes, ACID compliance, and TypeORM migrations.
- **Adaptive Frontend Workspace:** React 18 + Vite + Tailwind CSS featuring responsive public discovery, dedicated client portals, agent workflows, and executive administrative dashboards.
- **Multi-Device & Mobile Ready:** Designed for responsive access across desktops, tablets, and smartphones over local Wi-Fi / LAN networks.

---

## 2. Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | NestJS 10 (TypeScript) | Enterprise Node.js framework with dependency injection and modular architecture |
| **ORM & Data Layer** | TypeORM 0.3 | Data Mapper ORM, schema migrations, query builders, and pessimistic transaction locking |
| **Database** | MySQL 8.4 LTS | ACID-compliant relational database hosted in Docker on port `3307` |
| **Authentication** | Passport JWT & bcryptjs | Stateless Bearer token verification (1-hour lifespan) with server-side blacklist revocation |
| **Validation & Security**| class-validator & class-transformer | Strict DTO validation, whitelist sanitization, rate limiting, and parameterized queries |
| **Frontend Framework** | React 18, Vite, TypeScript | Single Page Application with optimized Vite bundling and fast HMR |
| **Styling & Design** | Tailwind CSS & Lucide Icons | Responsive styling, mobile navigation drawer, and warm architectural palette |
| **Network Proxy** | Vite Reverse Proxy | Automatic `/api` forwarding to backend for seamless cross-device mobile access |
| **Automated Testing** | Comprehensive Test Suites | 46/46 Final Project API checks, 18/18 Stabilization checks, 34/34 Academic checks, and 21/21 E2E browser tests passing with 100% success rate |

---

## 3. How to Access EstateCore on Other Devices (Same Wi-Fi / LAN)

You can access and interact with the live EstateCore application from **smartphones (iOS/Android), tablets (iPad), or other laptops** connected to the same Wi-Fi router or local network &mdash; **no software installation required on those devices!**

### Step 1: Ensure the Host Machine is Running EstateCore
On the primary computer hosting the system, ensure the three services are running:
1. **Docker MySQL container** (port `3307`)
2. **NestJS Backend** (`npm run start:dev` on port `3000`)
3. **Vite Frontend Dev Server** (`npm run dev` on port `5173`)

### Step 2: Find the Host Machine's Local IP Address
Open PowerShell / Command Prompt on the host computer and run:
```powershell
ipconfig
```
Look for **IPv4 Address** under your active network adapter (e.g., **Wi-Fi** or **Ethernet**).
- *Example Local IP:* `192.168.254.105`

### Step 3: Open in the Browser on Any Device
On your smartphone, tablet, or secondary laptop:
1. Connect to the **same Wi-Fi network** as the host computer.
2. Open Chrome, Safari, or Edge.
3. In the address bar, type:
   ```text
   http://<HOST_IP>:5173
   ```
   *For example:* `http://192.168.254.105:5173`

> [!NOTE]
> **Zero Mobile Configuration Needed:** The frontend includes an automatic reverse proxy. All API requests (`/api/*`) made from your phone automatically route to the host backend without modifying configuration or triggering CORS errors.

### Step 4 (If Connection Times Out): Allow Port in Windows Firewall
If your mobile device fails to connect, Windows Firewall may be blocking incoming connections to port `5173`. Run this single command in **PowerShell as Administrator** on the host PC:
```powershell
New-NetFirewallRule -DisplayName "EstateCore Web (5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

---

## 4. Fresh Setup from Scratch on Another Computer

Follow these steps to clone, configure, and run EstateCore on a brand new Windows, Mac, or Linux computer.

### System Prerequisites
- **Git** ([Download Git](https://git-scm.com/))
- **Node.js** v18.x or v20.x LTS ([Download Node.js](https://nodejs.org/))
- **Docker Desktop** running ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))

---

### Step-by-Step Installation

#### 1. Clone the Completed Feature Branch
Clone the official completed submission branch directly:
```bash
git clone -b feature/phase5-2-final-project-completion https://github.com/Zett4u/EstateCore.git
cd EstateCore
```

#### 2. Create the Environment Configuration Files (.env)
The repository includes pre-configured `.env.example` templates with all matching database credentials and ports ready out-of-the-box:
```bash
# On Linux / macOS / Git Bash:
cp .env.example .env
cp backend/.env.example backend/.env

# On Windows PowerShell:
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```
> [!NOTE]
> **Academic Demonstration Configuration:** The default configuration connects to the Dockerized MySQL database `estatecore_db` on port `3307` and sets `JWT_EXPIRATION=3600s` (1 hour) matching the academic requirements in `estatecire.pdf`.
> For production deployments outside academic evaluation, generate a cryptographically strong JWT secret using:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### 3. Start the MySQL 8.4 Database Container
```bash
docker compose up -d
```
Verify the container is healthy and accepting connections:
```bash
docker compose ps
docker exec estatecore-mysql mysqladmin ping -u estatecore_user -pestatecore_secure_pass_2026
```
*(MySQL is exposed on host port `3307` mapped to internal `3306` to prevent conflicts with local services like XAMPP).*

#### 4. Setup Database Schema and Sample Data
You can populate the database using either of two methods:

- **Method A: TypeORM Schema Migrations & Seeder (Standard)**
  ```bash
  cd backend
  npm install
  npm run migration:run
  npm run seed
  ```

- **Method B: Instant Import from Verified Academic SQL Deliverable**
  ```bash
  docker exec -i estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db < documentation/deliverables/EstateCore_Final_Project.sql
  ```

#### 5. Start the Backend API
In the `backend` terminal:
```bash
npm run start:dev
```
*Backend API will be running at:* `http://localhost:3000/api/v1` (with `/api` backward-compatibility alias).

#### 6. Setup and Start the Frontend Application
Open a second terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite server accessible across network interfaces
npm run dev
```
*Frontend will be running at:*
- Local Machine: `http://localhost:5173`
- Network / Other Devices: `http://<YOUR_IP>:5173`

---

## 5. Pre-Seeded Demonstration Accounts

The database comes pre-seeded with verified test accounts across all three system roles:

| Role | Email Address | Password | Privileges & Purpose |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@estatecore.local` | `Password123!` | System-wide oversight, User directory, Global inquiries, Create/Delete listings |
| **AGENT** | `maria.santos@estatecore.local` | `Password123!` | Assigned residential portfolio, Inquiries follow-up, Viewing schedule management |
| **AGENT** | `carlos.reyes@estatecore.local` | `Password123!` | Commercial listings, Lead qualification, Schedule confirmation |
| **CLIENT** | `juan.delacruz@client.local` | `Password123!` | Browse catalog, Submit inquiries, Book and cancel personal tour appointments |
| **CLIENT** | `elena.roxas@client.local` | `Password123!` | Discover properties, Track personal appointments and inquiries |

> [!TIP]
> The login screen at `http://localhost:5173/login` includes **1-Click Demo Buttons** (Admin, Agent, Client) that instantly populate these credentials for convenient presentations.

---

## 6. System Architecture & Workspaces

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Devices & Browsers                   │
│   (Desktop Chrome / Mac Safari / iOS Safari / Android)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSocket (Port 5173)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Vite Development & Proxy Server                 │
│         - React 18 SPA (Tailwind CSS, Lucide Icons)         │
│         - Reverse Proxy: /api/* -> http://localhost:3000    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (Port 3000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 NestJS REST API Backend                     │
│         - Global JWT Auth Guard & Roles Guard (RBAC)        │
│         - ValidationPipe (Whitelist & DTO Constraints)      │
│         - Modules: Auth, Users, Properties, Inquiries, Appt │
└──────────────────────────────┬──────────────────────────────┘
                               │ MySQL Protocol (Port 3307)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Docker Container: estatecore-mysql               │
│         - MySQL 8.4 LTS Database (InnoDB Engine)            │
│         - Persistent Docker Volume: mysql_data              │
└─────────────────────────────────────────────────────────────┘
```

### Workspaces by Role:
1. **Public Discovery (`/`, `/properties`, `/about`, `/contact`)**:
   - High-contrast visual property cards, real-time search, transaction toggles (*For Sale* / *For Rent*), category tabs (*Condominiums, Houses, Townhouses, Commercial, Land*), price filters, and full detail dossiers.
2. **Client Portal (`/client`, `/appointments`, `/inquiries`, `/profile`)**:
   - Track submitted inquiries, view assigned real estate advisor details, inspect scheduled viewing tours, and cancel appointments on demand.
3. **Agent Workspace (`/agent`, `/properties/new`, `/appointments`, `/inquiries`)**:
   - Manage assigned listings, publish new verified architectural listings, follow up on prospect inquiries, and review client appointment dates.
4. **Admin Command Center (`/admin`, `/users`, `/inquiries`, `/appointments`)**:
   - Executive operations overview, live database role distribution metrics, user account deactivation/activation, and cross-organization property governance.

---

## 7. Verification & Automated Testing

EstateCore includes comprehensive automated test suites ensuring zero regression, strong RBAC compliance, concurrency locking, and reliable full-stack behavior.

### 1. Final Project Comprehensive API Suite (46 Tests)
Validates all 39 mapped REST endpoints, dual-prefix routing (`/api/v1` and `/api`), role permissions, DTO validation schemas, and negative error conditions against the isolated sandbox database (`estatecore_test_restore` on port 3307).
```bash
node scripts/test_final_project_36_endpoints.js
```
- **Result:** `46 / 46 passed (100.0%)` with zero errors.
- **Evidence:** `documentation/evidence/final-project/07_api_testing/final_36_endpoints_results.json`

### 2. Concurrency & Security Stabilization Suite (18 Tests)
Validates pessimistic write locking (`pessimistic_write`) under simultaneous race conditions, atomic status transitions to `SOLD`, 1-hour JWT expiration, 5-attempt brute force rate-limiting lockout (`429 Too Many Requests`), and photo upload path traversal defenses.
```bash
node scripts/test_phase5_1_stabilization.js
```
- **Result:** `18 / 18 passed (100.0%)` with zero errors.

### 3. Academic Endpoints Workflow Suite (34 Tests)
Validates Laboratory Activity 05 workflows: user registration, public agent directory, listing publication, photo attachments, formal price offer submission, and relational delete protection.
```bash
node scripts/test_phase5_academic_endpoints.js
```
- **Result:** `34 / 34 passed (100.0%)` with zero errors.

### 4. Playwright End-to-End Browser Suite (21 Tests)
Covers all browser flows, form interactions, mobile drawer responsiveness, negative authorization redirects, and appointment cancellations.
```bash
node test_playwright.js
```
- **Result:** `21 / 21 tests passed` with `0 console errors`.
- **Evidence:** Visual screenshots captured in [documentation/evidence/playwright/](documentation/evidence/playwright/).

---

## 8. Database Backup & Deliverable Verification

### Official Academic SQL Export
The final project deliverable dump is pre-packaged and verified:
- **Deliverable File:** `documentation/deliverables/EstateCore_Final_Project.sql` (18.1 KB)
- **Schema:** 7 tables (`users`, `agents`, `properties`, `property_photos`, `inquiries`, `appointments`, `property_transactions`).
- **Data Integrity:** Fully populated with verified academic seed personas and listing catalog. Verified via clean import into temporary database `estatecore_verify_import`.

---

## 9. Troubleshooting & FAQ

#### Q1: Other devices cannot open `http://<HOST_IP>:5173`
- Ensure both devices are on the **exact same Wi-Fi network**.
- Check if your Wi-Fi router has "AP Isolation" or "Guest Mode" enabled (which prevents devices from talking to each other). Use a private home Wi-Fi network or mobile hotspot.
- Allow incoming traffic on port 5173 in Windows Firewall (see Section 3).

#### Q2: Docker port 3307 is already in use
- Check if another service is using port 3307:
  ```powershell
  Get-NetTCPConnection -LocalPort 3307
  ```
- If needed, adjust the host port mapping in [docker-compose.yml](docker-compose.yml) (e.g., `3308:3306`) and update `DB_PORT` in `backend/.env`.

#### Q3: Database migrations fail on fresh setup
- Ensure the Docker MySQL container is healthy before running migrations:
  ```bash
  docker compose ps
  ```
- Wait 5 seconds after `docker compose up -d` for MySQL to finish initializing, then re-run `npm run migration:run`.

---

## 10. Final Project Submission Deliverables & Audit

All academic submission requirements for **ITEC 116** are packaged under `documentation/deliverables/` and verified under `documentation/final-project/audit/`:

### Core Submission Deliverables:
1. **SQL Database Dump:** [EstateCore_Final_Project.sql](documentation/deliverables/EstateCore_Final_Project.sql) (18.1 KB, 7 relational tables + sample seed data).
2. **Postman API Collection:** [EstateCore_Final_Project.postman_collection.json](documentation/deliverables/EstateCore_Final_Project.postman_collection.json) (40.3 KB, 46 requests across 8 folders).
3. **Postman Environment Template:** [EstateCore_Postman_Environment.template.json](documentation/deliverables/EstateCore_Postman_Environment.template.json) (1.0 KB, pre-configured variables).
4. **Technical Documentation PDF:** [EstateCore_Final_Project_Documentation.pdf](documentation/deliverables/EstateCore_Final_Project_Documentation.pdf) (641.9 KB, 28-page compiled technical report).
5. **Presentation Deck:** [EstateCore_Final_Project_Presentation.pptx](documentation/deliverables/EstateCore_Final_Project_Presentation.pptx) (187.4 KB, 15 professional slides with speaker notes).
6. **Demonstration Script:** [EstateCore_5_to_10_Minute_Demo_Script.md](documentation/deliverables/EstateCore_5_to_10_Minute_Demo_Script.md) (7.6 KB, timed 8-minute narration script).
7. **Defense Q&A Preparation:** [EstateCore_Defense_Questions_and_Answers.md](documentation/deliverables/EstateCore_Defense_Questions_and_Answers.md) (5.8 KB, 10 panel questions with technical answers).

### Independent Audit Reports (`documentation/final-project/audit/`):
- [GITHUB_REPOSITORY_AUDIT.md](documentation/final-project/audit/GITHUB_REPOSITORY_AUDIT.md) — Git remote, commit history (`1a785d6` to `acf1a9f`), and branch topology.
- [BACKEND_IMPLEMENTATION_AUDIT.md](documentation/final-project/audit/BACKEND_IMPLEMENTATION_AUDIT.md) — NestJS architecture, zero-mock audit, and transaction safety.
- [DATABASE_INTEGRITY_AUDIT.md](documentation/final-project/audit/DATABASE_INTEGRITY_AUDIT.md) — 3NF schema, 13 foreign keys, and 100% live database isolation.
- [REST_API_ENDPOINT_AUDIT.md](documentation/final-project/audit/REST_API_ENDPOINT_AUDIT.md) — Line-by-line inventory of all 39 mapped endpoints.
- [AUTHENTICATION_SECURITY_AUDIT.md](documentation/final-project/audit/AUTHENTICATION_SECURITY_AUDIT.md) — 1-hour JWT, blacklist revocation, BOLA, rate limiting, and email-only mandate.
- [AUTOMATED_TEST_RESULTS.md](documentation/final-project/audit/AUTOMATED_TEST_RESULTS.md) — Complete execution records and 139/144/163 test reconciliation.
- [ACADEMIC_REQUIREMENTS_TRACEABILITY.md](documentation/final-project/audit/ACADEMIC_REQUIREMENTS_TRACEABILITY.md) — Requirements traceability matrix for Labs 03–06 & final project criteria.
- [FINAL_DELIVERABLES_AUDIT.md](documentation/final-project/audit/FINAL_DELIVERABLES_AUDIT.md) — Verification of all submission files and sizes.
- [MISSING_REQUIREMENTS_AND_DEFECTS.md](documentation/final-project/audit/MISSING_REQUIREMENTS_AND_DEFECTS.md) — Rigorous gap and defect analysis.
- [ESTATECORE_FINAL_COMPLETION_VERDICT.md](documentation/final-project/audit/ESTATECORE_FINAL_COMPLETION_VERDICT.md) — Formal evaluative verdict.
- [evidence_index.json](documentation/final-project/audit/evidence_index.json) — Machine-readable audit catalog.

> [!IMPORTANT]
> **Pending Submission Task for Student:**  
> The physical video file (`.mp4`, 5–10 minutes) must be recorded by the student developer (**Cabico, Cristina O.**) using the provided presentation slides and timed script prior to submission to the university portal.

---

## 11. Developer Documentation Suite

For developers, evaluators, and system maintainers who wish to understand the codebase, inspect the schema, or reproduce testing independently, comprehensive technical guides are available under `documentation/developer/`:

1. **System Overview:** [documentation/developer/SYSTEM_OVERVIEW.md](documentation/developer/SYSTEM_OVERVIEW.md) — Business domain, personas, capabilities, and system boundaries.
2. **System Architecture:** [documentation/developer/SYSTEM_ARCHITECTURE.md](documentation/developer/SYSTEM_ARCHITECTURE.md) — 3-tier architecture, request lifecycle, data flow, and concurrency controls.
3. **Database & ERD Guide:** [documentation/developer/DATABASE_AND_ERD_GUIDE.md](documentation/developer/DATABASE_AND_ERD_GUIDE.md) — Entity-relationship diagram, 3NF schema, foreign key inventory, deletion rules, and ID disambiguation (`users.id` vs `agents.id`).
4. **Backend Developer Guide:** [documentation/developer/BACKEND_DEVELOPER_GUIDE.md](documentation/developer/BACKEND_DEVELOPER_GUIDE.md) — NestJS modules, controller-service-repository patterns, DTO validation, and transaction managers.
5. **Frontend Developer Guide:** [documentation/developer/FRONTEND_DEVELOPER_GUIDE.md](documentation/developer/FRONTEND_DEVELOPER_GUIDE.md) — React 18, Vite proxy, state management, role-based route guards, and component hierarchy.
6. **API Reference:** [documentation/developer/API_REFERENCE.md](documentation/developer/API_REFERENCE.md) — Complete 39-route specification with request/response examples and status codes.
7. **Installation & Setup Guide:** [documentation/developer/INSTALLATION_AND_SETUP.md](documentation/developer/INSTALLATION_AND_SETUP.md) — Step-by-step instructions for clean Docker install or instant SQL dump restoration.
8. **Testing & Verification Guide:** [documentation/developer/TESTING_AND_VERIFICATION.md](documentation/developer/TESTING_AND_VERIFICATION.md) — Detailed execution commands for all 4 test suites.
9. **Troubleshooting Guide:** [documentation/developer/TROUBLESHOOTING.md](documentation/developer/TROUBLESHOOTING.md) — Solutions for common connection, migration, port, and firewall issues.
10. **Academic Traceability Matrix:** [documentation/developer/ACADEMIC_REQUIREMENTS_TRACEABILITY.md](documentation/developer/ACADEMIC_REQUIREMENTS_TRACEABILITY.md) — Line-by-line mapping of Labs 03–06 and Final Project criteria to source code and tests.
11. **Developer Handoff Audit:** [documentation/developer/FINAL_DEVELOPER_HANDOFF_AUDIT.md](documentation/developer/FINAL_DEVELOPER_HANDOFF_AUDIT.md) — Final technical evaluative verdict and handoff verification.

---

## 12. Academic Evaluation & License

Developed for academic presentation and evaluation in **ITEC 116 — Systems Integration and Architecture 2**.  
**Instructor:** John Vincent A. Dallego, MIT  
**Student Developer:** Cabico, Cristina O. (BSIT 4-C)  
All rights reserved © 2026.
