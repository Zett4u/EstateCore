# ESTATECORE — REQUIREMENTS TRACEABILITY MATRIX (RTM)

**Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student:** Cabico, Cristina O. | BSIT 4-C  
**Document Ref:** RTM-FINAL-2026-v1.0  
**Verification Target:** Sandbox `estatecore_test_restore` (Port 3307)  

---

## 1. Traceability Overview
This Requirements Traceability Matrix maps every laboratory activity (Lab 03 to Lab 06) and Final Project instruction from `estatecire.pdf` and `09_Final_Project_Student_Copy.pdf` directly to the EstateCore codebase, database schema, REST API controllers, test scripts, and empirical verification artifacts.

---

## 2. Requirements Compliance Table

| Req ID | Academic Source | Requirement Category | Specific Academic Mandate | Implementation Code / Location | Verification Method | Status |
|---|---|---|---|---|---|---|
| **REQ-01** | Final Project p. 2 | REST Endpoints | Minimum of 20 working REST endpoints (GET, POST, PUT/PATCH, DELETE) | 7 NestJS Controllers (`src/*/*.controller.ts`) | `scripts/test_final_project_36_endpoints.js` (46 tests) | **EXCEEDED (39 Endpoints)** |
| **REQ-02** | Final Project p. 2 | CRUD Modules | At least two functional CRUD modules beyond authentication | Properties, Inquiries, Appointments, Users, Transactions, Agents | Controller integration & UI management views | **EXCEEDED (6 CRUD Modules)** |
| **REQ-03** | Final Project p. 2 | Authentication | Stateless JWT authentication with route protection guards | `backend/src/common/guards/jwt-auth.guard.ts` | Token issuance, expiration & verification tests | **COMPLETED (100%)** |
| **REQ-04** | Final Project p. 3 | Database | MySQL Relational Database managed with TypeORM ORM | TypeORM entities (`src/*/entities/*.entity.ts`) | DDL schema verification & live DB isolation | **COMPLETED (100%)** |
| **REQ-05** | Final Project p. 3 | Postman Deliverable | Exported Postman collection and environment template | `documentation/deliverables/EstateCore_Final_Project.postman_collection.json` | 46 requests across 8 folders | **COMPLETED (100%)** |
| **REQ-06** | Final Project p. 3 | Database Export | SQL database export with DDL and clean seed data | `documentation/deliverables/EstateCore_Final_Project.sql` | Imported & validated against temporary DB | **COMPLETED (100%)** |
| **REQ-07** | Final Project p. 4 | Documentation | Comprehensive Technical Documentation (PDF) | `documentation/final-project/EstateCore_Final_Project_Documentation.pdf` | Headless Chrome 626.9 KB PDF | **COMPLETED (100%)** |
| **REQ-08** | Final Project p. 7 | Video Demo Script | 5–10 minute demonstration script and timeline | `documentation/deliverables/EstateCore_5_to_10_Minute_Demo_Script.md` | Minute-by-minute spoken walkthrough | **COMPLETED (100%)** |
| **REQ-09** | Final Project p. 8 | Oral Defense | Presentation slides (.pptx) & Defense Q&A guide | `documentation/deliverables/EstateCore_Final_Project_Presentation.pptx` | Structured slides & 15 defense Q&A pairs | **COMPLETED (100%)** |
| **REQ-10** | Lab 03 | Architecture & ERD | 3-tier system architecture and entity modeling | 6 core academic entities + `appointments` table | TypeORM relations & schema constraints | **COMPLETED (100%)** |
| **REQ-11** | Lab 04 | Schema Integrity | Foreign keys, indexes, CASCADE and RESTRICT behaviors | `database/migrations/` and TypeORM relations | FK constraints verified in MySQL 8.4 InnoDB | **COMPLETED (100%)** |
| **REQ-12** | Lab 05 | API Workflows | 19 specific Lab 05 REST endpoints implemented | All 19 endpoints mapped under `/api/v1` | `scripts/test_phase5_academic_endpoints.js` | **COMPLETED (100%)** |
| **REQ-13** | Lab 06 | Security & RBAC | Strict 1-hour JWT expiration, role guards, password hash | `auth/auth.service.ts`, `jwt.strategy.ts` (3600s) | In-memory blacklist & 60 security tests | **COMPLETED (100%)** |
| **REQ-14** | Lab 06 p. 21 | Rate Limiting | Rate limiting on login (5 consecutive failures -> 429) | `auth/auth.service.ts` in-memory failed attempt map | HTTP 429 Too Many Requests response verified | **COMPLETED (100%)** |
| **REQ-15** | Lab 06 p. 22 | JWT Claims | Agent token must contain `agentId` claim | `auth/auth.service.ts` payload resolution | Verified in `test_phase5_1_stabilization.js` | **COMPLETED (100%)** |
| **REQ-16** | System Boundary | Email-Only Mandate | Strict email-only communication; ZERO SMS | Clean codebase with zero cellular/SMS dependencies | Grep audit confirms zero SMS libraries | **COMPLETED (100%)** |
| **REQ-17** | Data Safety | Live DB Isolation | Strict sandbox targeting; ZERO changes to `estatecore_db` | MySQL port 3307 sandbox `estatecore_test_restore` | `scripts/audit_live_database_isolation.js` | **COMPLETED (100%)** |
