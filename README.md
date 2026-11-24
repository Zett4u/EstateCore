# EstateCore — Real Estate Management System
### Full-Stack Systems Integration Enterprise Prototype (ITEC 116)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/NestJS-10.4-red.svg)]()
[![Database](https://img.shields.io/badge/MySQL-8.4_LTS-blue.svg)]()
[![Container](https://img.shields.io/badge/Docker-Compose-2496ED.svg)]()
[![Auth](https://img.shields.io/badge/Authentication-JWT_Passport-yellow.svg)]()
[![Frontend](https://img.shields.io/badge/React-18_Vite_Tailwind-61DAFB.svg)]()
[![Playwright Tests](https://img.shields.io/badge/Playwright_E2E-21%2F21_Passed-success.svg)]()
[![Security & RBAC](https://img.shields.io/badge/RBAC_Audit-18%2F18_Passed-success.svg)]()

---

## 1. Project Overview

**EstateCore** is a centralized, full-stack Real Estate Management Information System designed and implemented for **ITEC 116 (IT Elective 4: Systems Integration and Architecture 2)** under the supervision of **John Vincent A. Dallego, MIT**.

The platform provides a modern architectural solution to streamline real estate operations: organizing property holdings, processing prospect inquiries, scheduling viewing appointments, and coordinating real estate advisors through a secured, role-guarded RESTful API and relational database.

### System Capabilities
- **22 Production REST API Endpoints:** Complete business coverage across Authentication, Identity, Property Listings, Inquiry Pipelines, and Tour Appointments.
- **Strict Role-Based Access Control (RBAC):** Server-side enforcement with zero trust for `ADMIN`, `AGENT`, and `CLIENT` roles, backed by ownership verification guards preventing IDOR.
- **Dockerized Relational Persistence:** MySQL 8.4 LTS running in an isolated Docker container with named persistent volumes, ACID compliance, and TypeORM migrations.
- **Adaptive Frontend Workspace:** React 18 + Vite + Tailwind CSS featuring responsive public discovery, dedicated client portals, agent workflows, and executive administrative dashboards.
- **Multi-Device & Mobile Ready:** Designed for responsive access across desktops, tablets, and smartphones over local Wi-Fi / LAN networks.

---

## 2. Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | NestJS 10 (TypeScript) | Enterprise Node.js framework with dependency injection and modular architecture |
| **ORM & Data Layer** | TypeORM 0.3 | Data Mapper ORM, schema migrations, query builders, and relation hydration |
| **Database** | MySQL 8.4 LTS | ACID-compliant relational database hosted in Docker on port `3307` |
| **Authentication** | Passport JWT & bcryptjs | Stateless Bearer token verification and 10-round salted password hashing |
| **Validation & Security**| class-validator & class-transformer | Strict DTO validation, whitelist sanitization, and parameterized SQL queries |
| **Frontend Framework** | React 18, Vite, TypeScript | Single Page Application with optimized Vite bundling and fast HMR |
| **Styling & Design** | Tailwind CSS & Lucide Icons | Responsive styling, mobile navigation drawer, and warm architectural palette |
| **Network Proxy** | Vite Reverse Proxy | Automatic `/api` forwarding to backend for seamless cross-device mobile access |
| **Automated Testing** | Playwright & Custom RBAC Suite | 21/21 E2E browser tests and 18/18 API security tests passing with 0 errors |

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

#### 1. Clone the Repository
```bash
git clone https://github.com/Zett4u/EstateCore.git
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
*(Note: If you skip this step, NestJS and Docker Compose will automatically use built-in safe defaults, but copying the file ensures custom configurations are supported).*

#### 3. Start the MySQL 8.4 Database Container
```bash
docker compose up -d
```
Verify the container is healthy:
```bash
docker compose ps
```
*(MySQL is exposed on host port `3307` mapped to internal `3306` to prevent conflicts with local services like XAMPP).*

#### 4. Setup and Start the Backend API
Open a new terminal window:
```bash
cd backend

# Install dependencies
npm install

# Run schema migrations
npm run migration:run

# Seed initial system accounts and listings
npm run seed

# Start NestJS in development mode
npm run start:dev
```
*Backend API will be running at:* `http://localhost:3000/api`

#### 5. Setup and Start the Frontend Application
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

EstateCore includes two automated test suites ensuring zero regression, strong RBAC compliance, and reliable UI behavior.

### 1. Playwright End-to-End Suite (21 Tests)
Covers all browser flows, form interactions, mobile drawer responsiveness, negative authorization redirects, and appointment cancellations.
```bash
node test_playwright.js
```
- **Result:** `21 / 21 tests passed` with `0 console errors`.
- **Evidence:** Visual screenshots captured in [documentation/evidence/playwright/](documentation/evidence/playwright/).

### 2. Negative RBAC & Security Audit Suite (18 Tests)
Direct HTTP assertions verifying role boundaries, IDOR resistance, past date appointment rejections, and direct MySQL query validations.
```bash
node test_security_rbac.js
```
- **Result:** `18 / 18 tests passed` (`403 Forbidden` / `401 Unauthorized` enforced where appropriate).

---

## 8. Database Backup & Restoration

### Create a Complete SQL Dump
```bash
docker exec estatecore-mysql mysqldump -u root -pestatecore_root_secure_pass_2026 --no-tablespaces --databases estatecore_db --add-drop-table > database/exports/estatecore_database.sql
```

### Restore Database from SQL Dump
```bash
docker exec -i estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db < database/exports/estatecore_database.sql
```

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

## 10. Academic Documentation & Defense

For detailed entity-relationship diagrams (ERD), normalization proofs (1NF to 3NF), API specification matrices, and presentation slides:
- **Comprehensive Documentation:** [docs/FINAL_PROJECT_DOCUMENTATION.md](docs/FINAL_PROJECT_DOCUMENTATION.md)
- **Role-Based Permission Matrix:** [documentation/RBAC_PERMISSION_MATRIX.md](documentation/RBAC_PERMISSION_MATRIX.md)
- **Multi-Device Setup Guide:** [docs/DEVICE_ACCESS_GUIDE.md](docs/DEVICE_ACCESS_GUIDE.md)

---

## 11. Academic Evaluation & License

Developed for academic presentation and evaluation in **ITEC 116 — Systems Integration and Architecture 2**.
All rights reserved © 2026.
