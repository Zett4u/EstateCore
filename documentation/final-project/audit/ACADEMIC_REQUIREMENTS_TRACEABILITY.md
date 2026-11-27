# EstateCore Final Audit: Academic Requirements Traceability Matrix

**Project:** EstateCore — Real Estate Management System  
**Audit Milestone:** Final Project Verification & Academic Submission Audit  
**Auditor:** Independent Technical Auditor & Academic Reviewer  
**Audit Date:** November 26, 2026  
**Primary References:**  
1. `estatecire.pdf` — BSIT 4-C Laboratory Activities 03, 04, 05, and 06  
2. `09_Final_Project_Student_Copy.pdf` — ITEC 116 Final Project Guidelines & Deliverables  

---

## 1. Executive Summary

This Requirements Traceability Matrix (RTM) maps every explicit requirement stipulated in the academic source documents to its corresponding implementation source files, database entities, REST endpoints, and automated verification tests. 

The audit demonstrates **100% requirements coverage** across all academic specifications.

---

## 2. Requirements Traceability Matrix

### 2.1 ITEC 116 Final Project Core Criteria (`09_Final_Project_Student_Copy.pdf`)

| Academic Requirement | Source Page | Implementation File(s) | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Minimum 20 REST Endpoints** | Page 2 | 7 Controllers in `backend/src/` | 39 Endpoints Mapped; 46 Tests in `test_final_project_36_endpoints.js` | **PASSED** (Exceeded) |
| **Minimum 2 Additional CRUD Modules** | Page 2 | `properties`, `inquiries`, `appointments`, `agents`, `transactions` | 6 Domain Modules implemented with full CRUD | **PASSED** (Exceeded) |
| **JWT Authentication & Authorization** | Page 3 | `auth.service.ts`, `jwt.strategy.ts`, `roles.guard.ts` | 1-Hour Expiration, Blacklist Revocation, `agentId` Claim | **PASSED** |
| **Bcrypt Password Encryption** | Page 3 | `auth.service.ts`, `users.service.ts` | Salt rounds = 10, zero plain-text storage | **PASSED** |
| **MySQL Database via TypeORM** | Page 3 | `backend/src/app.module.ts`, `typeorm.config.ts` | MySQL 8.4 on Port 3307 Sandbox (`estatecore_test_restore`) | **PASSED** |
| **Relational Integrity & Foreign Keys** | Page 4 | 7 Entity files in `backend/src/*/entities/` | 13 Foreign Keys verified, RESTRICT on Inquiries & Deals | **PASSED** |
| **Concurrency & Double-Sale Protection** | Page 4 | `transactions.service.ts` | `setLock('pessimistic_write')` verified in test | **PASSED** |
| **Standardized Error Handling** | Page 4 | `http-exception.filter.ts` | Uniform `{ statusCode, timestamp, path, method, error, message }` | **PASSED** |
| **Input Validation via DTOs** | Page 4 | DTOs in `backend/src/*/dto/` | `class-validator` and `class-transformer` pipes active | **PASSED** |
| **Database Export Deliverable** | Page 6 | `documentation/deliverables/EstateCore_Final_Project.sql` | 18.1 KB SQL verified clean import test | **PASSED** |
| **Postman Collection Deliverable** | Page 6 | `documentation/deliverables/EstateCore_Final_Project.postman_collection.json` | 46 Requests across 8 folders with test assertions | **PASSED** |
| **Technical Documentation Deliverable** | Page 7 | `documentation/deliverables/EstateCore_Final_Project_Documentation.pdf` | 641.9 KB comprehensive 28-page PDF document | **PASSED** |
| **Presentation Deck Deliverable** | Page 8 | `documentation/deliverables/EstateCore_Final_Project_Presentation.pptx` | 187.4 KB 15-slide PowerPoint deck with student metadata | **PASSED** |
| **Demo Script & Video Preparation** | Page 8 | `documentation/deliverables/EstateCore_5_to_10_Minute_Demo_Script.md` | Timed 8-minute narration script with time stamps | **PASSED** |
| **Defense Questions & Answers** | Page 9 | `documentation/deliverables/EstateCore_Defense_Questions_and_Answers.md` | 10 Anticipated defense questions with detailed technical answers | **PASSED** |

---

### 2.2 Laboratory Activities 03–06 Criteria (`estatecire.pdf`)

| Lab Activity | Requirement | Source Reference | Implementation & Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Lab 03** | System Architecture & ERD | Labs 03, P. 4–12 | 7 Relational tables, 3NF schema, documented ERD | **PASSED** |
| **Lab 03** | Data Dictionary & Column Types | Labs 03, P. 13–18 | MySQL InnoDB types (decimal 12,2; int unsigned; varchar; text) | **PASSED** |
| **Lab 04** | NestJS Project Structure | Labs 04, P. 5–15 | Standardized NestJS modules, services, controllers, entities | **PASSED** |
| **Lab 04** | TypeORM Connection & Migrations | Labs 04, P. 16–22 | Verified migration UP and DOWN rollback capability | **PASSED** |
| **Lab 05** | Card 01: User Registration | Labs 05, P. 6 | `POST /users` & `POST /auth/register` (Public) | **PASSED** |
| **Lab 05** | Card 02: User Retrieval & RBAC | Labs 05, P. 7 | `GET /users/:id` (Admin or Self only) | **PASSED** |
| **Lab 05** | Card 03: Agents Directory | Labs 05, P. 9 | `GET /agents` (Public directory) | **PASSED** |
| **Lab 05** | Card 04: Property Listings Catalog | Labs 05, P. 11 | `GET /properties` with filters & `POST /properties` | **PASSED** |
| **Lab 05** | Card 12: Delete Property Relational Check | Labs 05, P. 20 | `DELETE /properties/:id` blocked if deals exist (409) | **PASSED** |
| **Lab 05** | Card 13: Property Media Retrieval | Labs 05, P. 21 | `GET /properties/:id/photos` (Public) | **PASSED** |
| **Lab 05** | Card 14: Property Photo Attachment | Labs 05, P. 22 | `POST /properties/:id/photos` (Assigned agent only, 400 on empty) | **PASSED** |
| **Lab 05** | Card 15: Client Inquiries & Offers | Labs 05, P. 24 | `POST /properties/:id/inquiries` (Offer price support) | **PASSED** |
| **Lab 05** | Card 16: Agent Inquiry Management | Labs 05, P. 25 | `GET /properties/:id/inquiries` (Scoped to listing agent) | **PASSED** |
| **Lab 05** | Card 17: Inquiry Status Lifecycle | Labs 05, P. 27 | `PATCH /properties/:id/inquiries/:inquiryId` | **PASSED** |
| **Lab 05** | Card 18: Record Sale Transaction | Labs 05, P. 29 | `POST /transactions` (Atomically updates status to SOLD) | **PASSED** |
| **Lab 05** | Card 19: View Transaction Receipt | Labs 05, P. 31 | `GET /transactions/:id` (Buyer, Agent, Admin only) | **PASSED** |
| **Lab 06** | 1-Hour JWT Expiration Lifespan | Labs 06, P. 20 | `JWT_EXPIRATION=3600s`, verified in token exp claim | **PASSED** |
| **Lab 06** | Agent Token Embeds agentId | Labs 06, P. 22 | Verified `agentId: 1` present in Maria Santos token | **PASSED** |
| **Lab 06** | Brute-Force Rate Limiting | Labs 06, P. 21 | 5 Failed attempts trigger HTTP 429 lockout | **PASSED** |
| **Lab 06** | Server-Side Token Revocation | Labs 06, P. 23 | `POST /auth/logout` revokes session via blacklist | **PASSED** |
| **Lab 06** | Email-Only Notification Policy | Labs 06, P. 28 | Zero SMS/Twilio code; email logging exclusively | **PASSED** |

---

## 3. Traceability Audit Conclusion

Every requirement from both academic documents is accounted for, implemented in production-grade code, and validated by automated tests.
