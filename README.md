# EstateCore — Real Estate Management System
### Full-Stack Systems Integration Backend Prototype (ITEC 116)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/NestJS-10.4-red.svg)]()
[![Database](https://img.shields.io/badge/MySQL-8.4_LTS-blue.svg)]()
[![Container](https://img.shields.io/badge/Docker-Compose-2496ED.svg)]()
[![Auth](https://img.shields.io/badge/Authentication-JWT_Passport-yellow.svg)]()
[![Frontend](https://img.shields.io/badge/React-18_Vite_Tailwind-61DAFB.svg)]()

---

## 1. Project Overview

**EstateCore** is a centralized, full-stack Real Estate Management Information System designed and implemented for **ITEC 116 (IT Elective 4: Systems Integration and Architecture 2)** under the supervision of **John Vincent A. Dallego, MIT**.

The system streamlines real estate operations by organizing property listings, processing client inquiries, scheduling property viewing appointments, and managing agent assignments through a secured, role-guarded RESTful API and relational database.

### Key Capabilities
- **22 Production REST API Endpoints:** Spanning Authentication, User Management, Property Listings, Inquiries, and Viewing Appointments.
- **Role-Based Access Control (RBAC):** Server-side enforcement for `ADMIN`, `AGENT`, and `CLIENT` user roles.
- **Dockerized Relational Persistence:** MySQL 8.4 running in an isolated Docker container with named persistent volumes and health checks.
- **TypeORM Migrations & Seeds:** Idempotent database migrations and automatic seeding of realistic initial accounts and listings.
- **Interactive React Management Frontend:** Role-specific dashboards (Admin, Agent, Client), search/filter catalog, and appointment scheduler.

---

## 2. Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | NestJS 10 (TypeScript) | Modular enterprise Node.js framework with dependency injection |
| **ORM** | TypeORM 0.3 | Object-relational mapping, migrations, and query building |
| **Database** | MySQL 8.4 LTS | ACID-compliant relational persistence running via Docker |
| **Infrastructure** | Docker Desktop & Compose | Containerized database on host port 3307 (mapped to 3306) |
| **Authentication** | Passport JWT & bcryptjs | Stateless Bearer token verification and 10-round salted password hashing |
| **Validation** | class-validator & class-transformer | Global request whitelist sanitization and DTO constraint validation |
| **Frontend** | React 18, Vite, Tailwind CSS | Management workstation UI with live API integration |
| **API Testing** | Postman & Node.js Test Suite | Complete 26-test suite with exported Postman collection JSON |

---

## 3. Repository Structure

```
EstateCore/
├── backend/                  # NestJS REST API source code
│   ├── src/
│   │   ├── auth/             # JWT authentication, passport strategy, login/register
│   │   ├── users/            # User entity, RBAC administration
│   │   ├── properties/       # Property listings CRUD with multi-field search & filters
│   │   ├── inquiries/        # Client inquiries and agent status pipeline
│   │   ├── appointments/     # Viewing appointment scheduler with conflict prevention
│   │   ├── common/           # Enums, guards (JwtAuth, Roles), decorators, filters
│   │   ├── database/         # TypeORM CLI data-source, migrations, and seed scripts
│   │   ├── app.module.ts     # Root NestJS module
│   │   └── main.ts           # Application bootstrap & global pipes
│   ├── package.json
│   └── .env.example
├── frontend/                 # React 18 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, ProtectedRoute, StatusBadge, StatCards
│   │   ├── context/          # AuthContext for session management
│   │   ├── pages/            # Admin, Agent, Client Dashboards, Listings, Forms, Inquiries
│   │   ├── services/         # Centralized API service with JWT interceptor
│   │   └── types/            # TypeScript interfaces
│   └── package.json
├── database/
│   └── exports/              # estatecore_database.sql (Clean MySQL schema + seed dump)
├── docs/
│   └── FINAL_PROJECT_DOCUMENTATION.md # Comprehensive ITEC 116 Technical Documentation
├── postman/
│   └── EstateCore.postman_collection.json # Exportable Postman test collection
├── docker-compose.yml        # MySQL 8.4 container specification
├── .env.example              # Environment variable template
└── README.md
```

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js v18+ or v20+
- Docker Desktop running

### Step 1: Start the MySQL Database (Docker)
```bash
# Clone the repository
git clone https://github.com/Zett4u/EstateCore.git
cd EstateCore

# Start the MySQL container in the background
docker compose up -d

# Verify container is healthy
docker compose ps
```
*Note: MySQL is published to host port `3307` to avoid conflicts if another MySQL service (such as XAMPP) occupies port 3306.*

### Step 2: Initialize & Start the Backend
```bash
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Seed initial accounts and properties
npm run seed

# Start NestJS development server
npm run start:dev
```
Backend API will be running at: `http://localhost:3000/api`

### Step 3: Start the Frontend UI
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend UI will be running at: `http://localhost:5173`

---

## 5. Seed Account Credentials

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@estatecore.local` | `Password123!` | System-wide visibility, user administration, property management |
| **AGENT** | `maria.santos@estatecore.local` | `Password123!` | Manage assigned listings, update inquiries, confirm appointments |
| **AGENT** | `carlos.reyes@estatecore.local` | `Password123!` | Commercial listings, tenant inquiries, confirm viewings |
| **CLIENT** | `juan.delacruz@client.local` | `Password123!` | Browse properties, submit inquiries, request viewings |
| **CLIENT** | `elena.roxas@client.local` | `Password123!` | Browse properties, submit inquiries, request viewings |

---

## 6. REST API Endpoint Overview (22 Endpoints)

### Authentication Module (3 endpoints)
- `POST /api/auth/register` — Public client account registration
- `POST /api/auth/login` — Authenticate and receive JWT access token
- `GET /api/auth/me` — Retrieve current authenticated user profile

### User Management Module (4 endpoints)
- `GET /api/users` — List system users (`ADMIN` only)
- `GET /api/users/:id` — Retrieve user profile details (`ADMIN` or Self)
- `PATCH /api/users/:id` — Update user profile details
- `DELETE /api/users/:id` — Deactivate user account (`ADMIN` only)

### Property Management Module (5 endpoints)
- `POST /api/properties` — Create property listing (`ADMIN` or `AGENT`)
- `GET /api/properties` — Search and filter property listings (Public)
- `GET /api/properties/:id` — Get single property details (Public)
- `PATCH /api/properties/:id` — Update listing details (`ADMIN` or Agent Owner)
- `DELETE /api/properties/:id` — Delete property listing (`ADMIN` or Agent Owner)

### Inquiry Management Module (5 endpoints)
- `POST /api/inquiries` — Submit property inquiry (Authenticated)
- `GET /api/inquiries` — List inquiries (Role-filtered)
- `GET /api/inquiries/:id` — Retrieve inquiry details
- `PATCH /api/inquiries/:id` — Update inquiry status or message
- `DELETE /api/inquiries/:id` — Delete inquiry record

### Appointment Management Module (5 endpoints)
- `POST /api/appointments` — Request viewing appointment with date conflict checks
- `GET /api/appointments` — List viewing appointments (Role-filtered)
- `GET /api/appointments/:id` — Retrieve appointment details
- `PATCH /api/appointments/:id` — Confirm, reschedule, or cancel appointment
- `DELETE /api/appointments/:id` — Cancel and delete appointment record

---

## 7. Database Export & Restoration

### Exporting Database to SQL
```bash
docker exec estatecore-mysql mysqldump -u root -pestatecore_root_secure_pass_2026 --no-tablespaces --databases estatecore_db --add-drop-table > database/exports/estatecore_database.sql
```

### Restoring Database from SQL
```bash
docker exec -i estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db < database/exports/estatecore_database.sql
```

---

## 8. Postman Collection Testing

Import the collection located at:
`postman/EstateCore.postman_collection.json`

Set the collection variable:
- `baseUrl`: `http://localhost:3000/api`

Login as `admin@estatecore.local` to automatically save the JWT token into the collection environment and run the automated test suite.

---

## 9. Academic Project Documentation

For the complete technical report, entity data dictionary, normalization proofs, architectural code walkthrough, and presentation outline, refer to:
**[docs/FINAL_PROJECT_DOCUMENTATION.md](docs/FINAL_PROJECT_DOCUMENTATION.md)**

---

## 10. License

Developed for academic evaluation under course ITEC 116 — Systems Integration and Architecture 2.
All rights reserved © 2026.
