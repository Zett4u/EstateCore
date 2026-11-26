# EstateCore Developer Guide: Installation & Setup Guide

**Project:** EstateCore — Real Estate Management System  
**Academic Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student Developer:** Cabico, Cristina O. (BSIT 4-C)  

---

## 1. System Prerequisites

Before starting, ensure your machine has the following tools installed:
- **Git:** Version 2.30+ ([https://git-scm.com/](https://git-scm.com/))
- **Node.js:** v18.x, v20.x, or v22.x LTS ([https://nodejs.org/](https://nodejs.org/))
- **Docker Desktop:** Running with Docker Compose v2 ([https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/))

---

## 2. Step-by-Step Installation

### Step 1: Clone the Official Completed Branch
Clone the official completed submission branch directly:
```bash
git clone -b feature/phase5-2-final-project-completion https://github.com/Zett4u/EstateCore.git
cd EstateCore
```

### Step 2: Configure Environment Files
The repository provides pre-configured templates with local academic demonstration values:
```bash
# On Linux / macOS / Git Bash:
cp .env.example .env
cp backend/.env.example backend/.env

# On Windows PowerShell:
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

#### Environment Details:
- **Database:** Connects to Docker MySQL 8.4 on port `3307`. (Host port 3307 is used to prevent port conflicts with local XAMPP/WAMP services running on 3306).
- **JWT Lifespan:** Set to `JWT_EXPIRATION=3600s` (exactly 1 hour), complying with Lab 06 (p. 20).
- **Generating a Production Secret:** For production or staging deployment, generate a cryptographically strong secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

### Step 3: Start the Dockerized MySQL 8.4 Container
```bash
docker compose up -d
```

Verify that the container is healthy:
```bash
docker compose ps
```
Verify MySQL is accepting connections:
```bash
docker exec estatecore-mysql mysqladmin ping -u estatecore_user -pestatecore_secure_pass_2026
```
*(Expected output: `mysqld is alive`)*

---

### Step 4: Setup Database Schema & Seed Data
Choose either of two methods:

#### Method A: Clean Migrations & Seeder via TypeORM (Standard)
```bash
cd backend
npm install
npm run migration:run
npm run seed
cd ..
```

#### Method B: Instant Restore from Audited Deliverable SQL Dump
If you want to immediately populate all 7 tables with verified academic seed records:
```bash
docker exec -i estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db < documentation/deliverables/EstateCore_Final_Project.sql
```

---

### Step 5: Start the Backend API Server
```bash
cd backend
npm install   # If not run in Step 4
npm run start:dev
```
- **API URL:** `http://localhost:3000/api/v1`
- **Legacy URL:** `http://localhost:3000/api` (Transparent alias)

---

### Step 6: Start the Frontend Application
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- **Local URL:** `http://localhost:5173`
- **LAN / Mobile URL:** `http://<YOUR_LOCAL_IP>:5173`

---

## 3. Pre-Seeded Demonstration Accounts

The database comes pre-seeded with verified test accounts across all three system roles:

| Role | Email Address | Password | Privileges & Purpose |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@estatecore.local` | `Password123!` | Full governance, user directory, global listing management |
| **AGENT** | `maria.santos@estatecore.local` | `Password123!` | Residential portfolio, inquiry follow-ups, tour calendar (`agentId: 1`) |
| **AGENT** | `carlos.reyes@estatecore.local` | `Password123!` | Commercial listings, deal negotiation (`agentId: 2`) |
| **CLIENT** | `juan.delacruz@client.local` | `Password123!` | Catalog discovery, formal offers, tour booking, property owner listing |
| **CLIENT** | `elena.roxas@client.local` | `Password123!` | Discover properties, tour scheduling |

> [!TIP]
> The login screen at `http://localhost:5173/login` features **1-Click Demo Buttons** (Admin, Agent, Client) that instantly populate these credentials for convenient presentations.
