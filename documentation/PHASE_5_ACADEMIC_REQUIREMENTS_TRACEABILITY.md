# EstateCore Phase 5.0 &mdash; Academic Requirements Traceability Matrix

**Project:** EstateCore &mdash; Real Estate Management System  
**Phase:** 5.0 &mdash; Academic Requirements Implementation, Feature Completion & System Integration  
**Academic Source of Truth:** `estatecire.pdf`  
**Coverage:** BSIT 4-C Laboratory Activities 03, 04, 05, and 06  
**Author / Student Reference:** Cabico, Cristina O. | BSIT 4-C  
**Branch:** `feature/phase5-academic-requirements`  
**Base Commit:** `92f3447c6c58b580522d40d85ea0def2af694f4b`  
**Date:** November 25, 2026  
**Status:** In Progress (Traceability & Gap Analysis)  

---

## 1. Executive Summary

This document establishes the end-to-end academic traceability between the original laboratory instructions (`estatecire.pdf`) and the implementation in EstateCore. Every requirement across Laboratory Activities 03, 04, 05, and 06 is identified with a unique requirement identifier, evaluated against the existing codebase, assigned an implementation status, and mapped to a planned action and verification method.

### Traceability Status Summary
- **COMPLETE:** Requirements fully implemented and verified in earlier phases.
- **PARTIALLY IMPLEMENTED:** Requirements where foundational schema or logic exists, but specific endpoints, upload handling, or frontend workflows remain incomplete.
- **NOT IMPLEMENTED:** Requirements specified in the PDF that have not yet been built.
- **BLOCKED:** Requirements dependent on unresolved prerequisites (None).
- **NOT APPLICABLE:** Non-software administrative or manual drafting instructions.

---

## 2. Laboratory Activity 03: System Architecture Design

| Requirement ID | PDF Lab | Requirement | Existing Implementation | Gap | Planned Action | Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-L03-01** | Lab 03 | **Centralized Property Database:** Store listings, client data, and transactions in one place. | MySQL database with `properties`, `users`, `inquiries`, `agents`, `property_transactions`, `property_photos`. | Full transaction creation workflow needs completion. | Complete transactions service & frontend. | Database query & schema inspection. | **PARTIALLY IMPLEMENTED** |
| **REQ-L03-02** | Lab 03 | **Manage Property Details:** Photos, prices, property types, statuses. | `properties` table & CRUD in `properties.controller.ts`. | Property photo endpoints and multipart upload completion. | Implement multipart photo upload & nested GET photos endpoint. | Integration tests & upload verification. | **PARTIALLY IMPLEMENTED** |
| **REQ-L03-03** | Lab 03 | **Buyer & Seller Tracking:** Track details of buyer and seller. | `properties.ownerId` (seller) and `property_transactions.buyerId`. | Transactions UI for buyers/agents to track deals. | Implement `TransactionsList.tsx` and transaction recording. | Playwright browser test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L03-04** | Lab 03 | **Email Notification Service:** Alert users on notable events. | Email alert abstractions and server logs (SMS strictly excluded by user directive). | Ensure email alerts trigger on inquiry/transaction creation. | Hook transaction and inquiry events to email notification logger/service. | Unit test execution. | **COMPLETE** |
| **REQ-L03-05** | Lab 03 | **Three-Tier Architecture:** Client App (Web Browser), App Server (NestJS REST API), Database Server (MySQL 8.4). | React 18 frontend + NestJS 10 backend + MySQL 8.4 sandbox. | None. Fully operational. | Preserve architecture. | Process check & ports verification. | **COMPLETE** |

---

## 3. Laboratory Activity 04: Database Design

| Requirement ID | PDF Lab | Requirement | Existing Implementation | Gap | Planned Action | Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-L04-01** | Lab 04 | **Entity: `User`**<br>`UserID`, `FirstName`, `LastName`, `Email` (UNIQUE), `ContactNumber`, `PasswordHash`, `Role` (Buyer/Renter/Seller/PropertyManager/Agent/Admin), `DateRegistered`. | `User` entity (`users` table). Passwords hashed with bcrypt. Unique email constraint. | Role enum supports `ADMIN`, `AGENT`, `CLIENT`. Single-role architecture with resource-level `ownerId`. | Preserve existing verified schema in sandbox. | Schema inspection & unit tests. | **COMPLETE** |
| **REQ-L04-02** | Lab 04 | **Entity: `Agent`**<br>`AgentID`, `UserID` (UNIQUE FK -> User.UserID), `LicenseNumber` (UNIQUE), `AgencyName` (NULL allowed). | `Agent` entity (`agents` table). User 1:1 Agent relationship verified. | None. Implemented in Phase 2/3. | Maintain foreign key integrity and isolation. | Referential integrity audit. | **COMPLETE** |
| **REQ-L04-03** | Lab 04 | **Entity: `Property`**<br>`PropertyID`, `OwnerID` (FK -> User.UserID), `AgentID` (FK -> Agent.AgentID), `Title`, `PropertyType`, `ListingType` (Sale/Rent), `Price` (> 0), `Address`, `City`, `Bedrooms` (>= 0), `Bathrooms` (>= 0), `Status` (Available/Reserved/Sold/Rented), `DateListed`. | `Property` entity (`properties` table). All columns and constraints present in sandbox schema. | Ensure status transitions update correctly upon transaction creation. | Enforce property status transitions in transaction workflow. | Transaction integration tests. | **COMPLETE** |
| **REQ-L04-04** | Lab 04 | **Entity: `PropertyPhoto`**<br>`PhotoID`, `PropertyID` (FK -> Property.PropertyID), `FilePath`, `DateUploaded`. | `PropertyPhoto` entity (`property_photos` table). | Support local disk storage paths (`/uploads/properties/...`) alongside URLs. | Add static file serving & multer disk storage. | File upload & storage test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L04-05** | Lab 04 | **Entity: `Inquiry`**<br>`InquiryID`, `PropertyID` (FK -> Property.PropertyID), `UserID` (FK -> User.UserID), `InquiryType` (Inquiry/Offer), `Message`, `OfferAmount` (NULL allowed, > 0), `Status` (Pending/Accepted/Rejected/Replied), `DateSent`. | `Inquiry` entity (`inquiries` table). `InquiryType`, `offerAmount`, `status` present. | Nested property endpoints (`GET /properties/:id/inquiries`) missing. | Implement nested inquiry endpoints in `properties.controller.ts`. | Controller integration tests. | **PARTIALLY IMPLEMENTED** |
| **REQ-L04-06** | Lab 04 | **Entity: `PropertyTransaction`**<br>`TransactionID`, `PropertyID` (FK -> Property.PropertyID), `BuyerID` (FK -> User.UserID), `AgentID` (FK -> Agent.AgentID), `Amount` (> 0), `TransactionType` (Sale/Rent), `PaymentMethod` (Cash/BankTransfer/GCash/Card), `TransactionDate`, `Status` (Pending/Completed/Cancelled). | `PropertyTransaction` entity (`property_transactions` table). | `POST /api/v1/transactions` missing in controller. | Implement transaction creation and status management. | Integration tests. | **PARTIALLY IMPLEMENTED** |
| **REQ-L04-07** | Lab 04 | **Relationship Cardinalities & Constraints:**<br>- User 1:1 Agent<br>- User 1:M Property (Owner)<br>- Agent 1:M Property<br>- Property 1:M PropertyPhoto (CASCADE)<br>- User 1:M Inquiry & Property 1:M Inquiry (RESTRICT)<br>- Property 1:M Transaction (RESTRICT)<br>- User 1:M Transaction (Buyer)<br>- Agent 1:M Transaction | All 8 cardinalities and foreign key constraints implemented in TypeORM sandbox schema. | None. Foreign key integrity verified. | Re-verify in Phase 5 migration audit. | Schema verification scripts. | **COMPLETE** |

---

## 4. Laboratory Activity 05: REST API Design and Specification

| Requirement ID | PDF Lab | Endpoint & Method | Description & Access | Existing Implementation | Gap | Planned Action | Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-L05-01** | Lab 05 | `POST /api/v1/users` | Register user (Public). Return 201 + user. | `auth.controller.ts` & `users.controller.ts`. | Ensure `POST /api/v1/users` is direct alias to registration. | Add direct `POST /api/v1/users` endpoint. | HTTP POST test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L05-02** | Lab 05 | `GET /api/v1/users/{id}` | Retrieve profile (Own profile or Admin). | `UsersController.findOne`: Enforces `currentUser.id === id \|\| currentUser.role === 'ADMIN'`. | None. | None. | HTTP GET test. | **COMPLETE** |
| **REQ-L05-03** | Lab 05 | `PATCH /api/v1/users/{id}` | Update user fields (Own profile). | `UsersController.update`: Strips role elevation. | None. | None. | HTTP PATCH test. | **COMPLETE** |
| **REQ-L05-04** | Lab 05 | `DELETE /api/v1/users/{id}` | Remove user account (Admin only). | `UsersController.remove`: `@Roles(UserRole.ADMIN)`. | None. | None. | HTTP DELETE test. | **COMPLETE** |
| **REQ-L05-05** | Lab 05 | `GET /api/v1/agents` | Retrieve all agents paginated (Public). | `AgentsController.findAll`: Returns public list. | Add pagination query support (`page`, `limit`, `agencyName`). | Update `AgentsController.findAll` with pagination query DTO. | HTTP GET test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L05-06** | Lab 05 | `POST /api/v1/agents` | Create agent profile for user (Agent role). | `AgentsController.create`: Currently `@Roles(UserRole.ADMIN)`. | Lab 05 allows Agent role to create own profile. | Update roles decorator to allow Agent/Admin and check `userId === currentUser.id`. | HTTP POST test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L05-07** | Lab 05 | `GET /api/v1/properties` | Search & list properties (Public, filtered, paginated). | `PropertiesController.findAll`: Filter by city, price, type, status. | Ensure all Lab 05 filters (`listingType`, `propertyType`, `minPrice`, `maxPrice`, `bedrooms`) are fully mapped. | Audit `QueryPropertyDto`. | HTTP GET test. | **COMPLETE** |
| **REQ-L05-08** | Lab 05 | `GET /api/v1/properties/{id}` | Retrieve one property (Public). | `PropertiesController.findOne`: Eager loads photos, agent, user, owner. | None. | None. | HTTP GET test. | **COMPLETE** |
| **REQ-L05-09** | Lab 05 | `POST /api/v1/properties` | Post new listing (Agent only, server sets agentId/dateListed). | `PropertiesController.create`: Auto-assigns agent or owner. | None. | None. | HTTP POST test. | **COMPLETE** |
| **REQ-L05-10** | Lab 05 | `PUT /api/v1/properties/{id}` | Replace whole listing (Agent own listing). | `PropertiesController.updatePut`: BOLA enforced. | None. | None. | HTTP PUT test. | **COMPLETE** |
| **REQ-L05-11** | Lab 05 | `PATCH /api/v1/properties/{id}` | Update selected fields (Agent own listing). | `PropertiesController.update`: BOLA enforced. | None. | None. | HTTP PATCH test. | **COMPLETE** |
| **REQ-L05-12** | Lab 05 | `DELETE /api/v1/properties/{id}` | Remove listing (Agent own listing or Admin). | `PropertiesController.remove`: Checks agent/owner. | Check 409 Conflict if property has existing transactions. | Add transaction existence check returning 409. | HTTP DELETE test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L05-13** | Lab 05 | `GET /api/v1/properties/{id}/photos` | Retrieve all photos of a property (Public). | Missing explicit nested endpoint. | Route does not exist on `PropertiesController`. | Add `GET :id/photos` to `PropertiesController`. | HTTP GET test. | **NOT IMPLEMENTED** |
| **REQ-L05-14** | Lab 05 | `POST /api/v1/properties/{id}/photos` | Attach photo to property (Agent own listing). | `PropertiesController.uploadPhoto`: Accepts JSON. | Does not support real file uploads with multer. | Add `FileInterceptor` for multipart upload alongside JSON. | Upload test. | **PARTIALLY IMPLEMENTED** |
| **REQ-L05-15** | Lab 05 | `POST /api/v1/properties/{id}/inquiries` | Send inquiry or price offer (Buyer/Renter). | `PropertiesController.createInquiry`: Present. | None. | None. | HTTP POST test. | **COMPLETE** |
| **REQ-L05-16** | Lab 05 | `GET /api/v1/properties/{id}/inquiries` | Retrieve all inquiries of a property (Agent own listing). | Missing explicit nested endpoint. | Route does not exist on `PropertiesController`. | Add `GET :id/inquiries` to `PropertiesController` with agent BOLA guard. | HTTP GET test. | **NOT IMPLEMENTED** |
| **REQ-L05-17** | Lab 05 | `PATCH /api/v1/properties/{id}/inquiries/{inquiryId}` | Update status of an inquiry (Agent own listing). | Missing explicit nested endpoint. | Route does not exist on `PropertiesController`. | Add `PATCH :id/inquiries/:inquiryId` to `PropertiesController`. | HTTP PATCH test. | **NOT IMPLEMENTED** |
| **REQ-L05-18** | Lab 05 | `POST /api/v1/transactions` | Record a sale or rental deal (Agent only). | Missing `POST` endpoint in `TransactionsController`. | Route does not exist. | Implement `POST /api/v1/transactions` in `TransactionsController` & Service. | HTTP POST test. | **NOT IMPLEMENTED** |
| **REQ-L05-19** | Lab 05 | `GET /api/v1/transactions/{id}` | Retrieve one transaction (Agent or Buyer involved). | `TransactionsController.findOne`: Enforces BOLA. | None. | None. | HTTP GET test. | **COMPLETE** |

---

## 5. Laboratory Activity 06: Authentication and Security Design

| Requirement ID | PDF Lab | Requirement | Existing Implementation | Gap | Planned Action | Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-L06-01** | Lab 06 | `POST /api/v1/auth/login` returning 200 OK + JWT `accessToken`, `tokenType: "Bearer"`, `expiresIn: 3600`. | `auth.controller.ts`: Generates 1-hour JWT. | None. | None. | HTTP POST test. | **COMPLETE** |
| **REQ-L06-02** | Lab 06 | `POST /api/v1/auth/logout` returning 204/200 and revoking session token. | `auth.controller.ts`: Blacklists token in `TokenBlacklistService`. | None. | None. | HTTP POST test. | **COMPLETE** |
| **REQ-L06-03** | Lab 06 | JWT Payload claims: `sub`, `email`, `role`, `agentId` (Agent role only), `iat`, `exp` (1 hour). | `auth.service.ts`: Populates `sub`, `email`, `role`, and `agentId` for agents. | None. | None. | Token decode test. | **COMPLETE** |
| **REQ-L06-04** | Lab 06 | **RBAC Access Control Matrix (19 Endpoints):** Deny by default, role scoping, resource ownership check. | NestJS `JwtAuthGuard`, `RolesGuard`, service-level BOLA checks. | Complete missing endpoints (EP 13, 14 upload, 16, 17, 18). | Implement endpoints with guards matching the matrix. | 60+ Security tests. | **PARTIALLY IMPLEMENTED** |
| **REQ-L06-05** | Lab 06 | **Security Measure 1: HTTPS (TLS)** | Supported via reverse proxy / development HTTPS. | None. | Maintain secure headers. | Configuration review. | **COMPLETE** |
| **REQ-L06-06** | Lab 06 | **Security Measure 2: Password Hashing (bcrypt)** | `bcryptjs` salted hashes (salt rounds = 10). PasswordHash never returned in API responses. | None. | Maintain password omission in entities. | Serialization test. | **COMPLETE** |
| **REQ-L06-07** | Lab 06 | **Security Measure 3: JWT Authentication** | Passport JWT strategy, signature validation, expiration checking, blacklist guard. | None. | Maintain guards on protected routes. | Auth tests. | **COMPLETE** |
| **REQ-L06-08** | Lab 06 | **Security Measure 4: RBAC, Least Privilege, Deny by Default** | Evaluates role and ownership. Unauthorized access returns 401/403. | None. | Enforce on all new endpoints. | Negative security tests. | **COMPLETE** |
| **REQ-L06-09** | Lab 06 | **Security Measure 5: Input Validation & Parameterized Queries** | `ValidationPipe` with `class-validator`, TypeORM parameterized queries. | Add validation DTO for `POST /api/v1/transactions`. | Create `CreateTransactionDto` with strict validators. | Bad request tests. | **PARTIALLY IMPLEMENTED** |
| **REQ-L06-10** | Lab 06 | **Security Measure 6: Rate Limiting & Account Lockout** | Throttler configuration and login rate protection. | None. | Maintain login protection. | Security test. | **COMPLETE** |
| **REQ-L06-11** | Lab 06 | **Security Measure 7: Secure Password Policy** | Minimum 8 characters with strength requirements. | Enforced in `RegisterDto`. | None. | Validation tests. | **COMPLETE** |

---

## 6. Frontend Academic Workflows Traceability

| Requirement ID | PDF Lab | Frontend Page / Workflow | Existing Implementation | Gap | Planned Action | Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-FE-01** | Lab 03/05 | **Property Management:** Create, Edit, View, List, Filter. | `PropertiesList.tsx`, `PropertyDetail.tsx`, `PropertyForm.tsx`. | Remediated in Phase 4.0. | Maintain adaptive layout. | Playwright suite. | **COMPLETE** |
| **REQ-FE-02** | Lab 03/04 | **Property Photo Management & Upload:** View photo gallery, upload photos. | Single image URL input. | True multipart file upload component & gallery display. | Add photo upload modal/section to `PropertyForm` & `PropertyDetail`. | Playwright browser test. | **NOT IMPLEMENTED** |
| **REQ-FE-03** | Lab 03/05 | **Inquiry & Offer Management:** Send inquiries/offers with `offerAmount`, view inquiries, update status. | `InquiriesList.tsx`, basic contact form on `PropertyDetail.tsx`. | Price offer input with `offerAmount` on property detail; Agent status updater (`Pending`, `Accepted`, `Rejected`, `Replied`). | Add offer input to `PropertyDetail` inquiry form; add status updater in `InquiriesList`. | Playwright browser test. | **PARTIALLY IMPLEMENTED** |
| **REQ-FE-04** | Lab 03/05 | **Transaction Management:** View deals (Buyer/Agent/Admin) and record deals (Agent). | None. No transaction UI in frontend. | Missing transaction page, deal modal, and sidebar navigation links. | Create `TransactionsList.tsx`, connect to API, add sidebar links. | Playwright browser test. | **NOT IMPLEMENTED** |
| **REQ-FE-05** | Lab 03/05 | **Agent Directory & Profile:** Public agent cards, license info, agency name. | Basic agent details shown on property cards. | Dedicated public agent directory page (`/agents`). | Implement `AgentsList.tsx` page. | Playwright browser test. | **PARTIALLY IMPLEMENTED** |
| **REQ-FE-06** | Lab 03/06 | **User Administration:** View users, manage status, delete user (Admin). | `UsersList.tsx` exists for Admin. | Add delete user button with confirmation modal. | Connect delete action to `DELETE /api/v1/users/:id`. | Playwright browser test. | **PARTIALLY IMPLEMENTED** |
| **REQ-FE-07** | Lab 03/06 | **Adaptive Layout System:** Guest vs Authenticated portal, sidebar, responsive breakpoints. | `AdaptiveCatalogLayout`, `PublicNavbar`, `Sidebar`. | None. Fully verified in Phase 4.0. | Preserve intact. | 24 Playwright tests. | **COMPLETE** |

---

## 7. Implementation Roadmap & Execution Plan

Based on the traceability analysis, the exact development tasks required for Phase 5.0 are:

1. **Backend API Completion:**
   - [ ] Implement `POST /api/v1/transactions` with strict agent validation, property status checks (409 on Sold), and transaction logging.
   - [ ] Implement nested `GET /api/v1/properties/:id/photos` and multipart file upload on `POST /api/v1/properties/:id/photos` with disk storage and static serving.
   - [ ] Implement nested `GET /api/v1/properties/:id/inquiries` and `PATCH /api/v1/properties/:id/inquiries/:inquiryId` with agent BOLA verification.
   - [ ] Add direct `POST /api/v1/users` registration alias matching Lab 05 EP 1.
   - [ ] Add pagination query parameters to `GET /api/v1/agents`.
   - [ ] Add transaction existence guard returning 409 Conflict on `DELETE /api/v1/properties/:id`.
2. **Frontend Workflow Completion:**
   - [ ] Build `TransactionsList.tsx` supporting viewing (Buyer/Agent/Admin) and recording deals (Agent).
   - [ ] Update `Sidebar.tsx` and `App.tsx` routes for Transactions.
   - [ ] Enhance `PropertyDetail.tsx` with price offer submission (`offerAmount`), photo gallery, and agent transaction recording button.
   - [ ] Enhance `PropertyForm.tsx` with photo upload management.
   - [ ] Implement public `AgentsList.tsx` for browsing licensed real estate agents.
   - [ ] Enable Admin delete account action in `UsersList.tsx`.
3. **Verification & Regression:**
   - [ ] Update backend security test suite to verify all 19 Lab 05 endpoints and access rules.
   - [ ] Update Playwright suite to verify end-to-end transaction recording, photo uploads, offer submissions, and agent browsing.
   - [ ] Verify zero-touch live database isolation.
