# EstateCore Developer Guide: System Overview

**Project:** EstateCore — Real Estate Management Information System  
**Academic Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student Developer:** Cabico, Cristina O. (BSIT 4-C)  
**Academic References:** `estatecire.pdf` (Labs 03–06) & `09_Final_Project_Student_Copy.pdf`  

---

## 1. Business Domain & Executive Summary

EstateCore is a centralized enterprise web application designed to streamline real estate operations for property agencies, licensed brokers, prospective buyers/renters, and property owners. 

In conventional real estate operations, agencies face significant friction:
1. **Disorganized Holdings:** Property specifications, photos, and legal ownership details are fragmented across spreadsheets and paper dossiers.
2. **Lead Leakage & Unassigned Inquiries:** Prospect inquiries received via web forms often go unanswered or lack assignment to licensed agents.
3. **Double-Sale & Concurrency Conflicts:** Multiple agents simultaneously executing sales for the same property can lead to catastrophic legal and transactional conflicts.
4. **Data Loss from Accidental Deletion:** Deleting property listings or user accounts can erase historical financial records and prospect correspondence.

EstateCore resolves these challenges through an ACID-compliant relational architecture, strict server-side Role-Based Access Control (RBAC), database-level concurrency locking, and relational deletion safeguards.

---

## 2. System Personas & Role Matrix

The platform models three primary global user roles defined in `backend/src/common/enums/role.enum.ts`:

```
                    ┌─────────────────────────┐
                    │      EstateCore User    │
                    │   (Authentication Base) │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│      ADMIN       │    │      AGENT       │    │      CLIENT      │
│  (System-wide    │    │ (Licensed Broker │    │  (Buyer, Renter, │
│   Governance)    │    │   / Advisor)     │    │   or Owner)      │
└──────────────────┘    └────────┬─────────┘    └──────────────────┘
                                 │ 1:1
                        ┌────────▼─────────┐
                        │   Agent Profile  │
                        │ (License, Agency)│
                        └──────────────────┘
```

### 2.1 Role Capabilities & Responsibilities

| Role | Domain Scope | Primary Capabilities |
| :--- | :--- | :--- |
| **`ADMIN`** | System-Wide | - Full user management (creation, role assignment, deactivation).<br>- Global listing catalog governance (create, update, delete any property).<br>- System-wide inquiry and appointment oversight.<br>- Global audit access to all financial settlements and transactions. |
| **`AGENT`** | Portfolio & Deals | - Public advisor profile listing with license number and agency details.<br>- Creation and management of assigned architectural property listings.<br>- Uploading high-resolution photographic media to assigned properties.<br>- Managing prospect inquiries and negotiating formal price offers.<br>- Confirming viewing tour appointments.<br>- Finalizing property acquisitions and recording financial settlements. |
| **`CLIENT`** | Consumer & Owner | - Browsing public catalog with category, price, and location filters.<br>- Submitting property-specific inquiries and formal purchase/rental offers.<br>- Scheduling and cancelling property viewing tour appointments.<br>- **Property Owner Capability:** Listing privately owned properties directly for sale/rent with ownership attribution. |

---

## 3. High-Level System Capabilities

1. **39 Mapped REST Endpoints:** Complete coverage across 7 dedicated domain controllers (Auth, Users, Agents, Properties, Inquiries, Appointments, Transactions) with `/api/v1` canonical routes and transparent `/api` backward-compatibility aliases.
2. **Pessimistic Concurrency Locking:** Enforces atomic property settlements via database transactions (`pessimistic_write` locks), preventing duplicate deals on contested properties.
3. **Relational Deletion Protection:** Foreign keys use `ON DELETE RESTRICT` on inquiries and transactions, ensuring audit trails and correspondence history cannot be deleted accidentally.
4. **Disambiguated Agent Identity:** Solves historical ID collision by separating `users.id` (authentication account) from `agents.id` (licensed broker profile), embedding `agentId` in the JWT token for seamless authorization.
5. **Session Security & Revocation:** 1-hour JWT expiration lifespan (`3600s`) coupled with server-side token blacklisting on logout.
6. **Adaptive Cross-Device UI:** Single Page Application built on React 18, Vite, and Tailwind CSS with automatic reverse proxy routing for local network mobile testing.

---

## 4. System Boundaries & Explicit Non-Goals

To maintain focus on core academic and enterprise real estate requirements, the system enforces the following architectural boundaries:
- **Email-Only Notification Policy:** Per Laboratory Activity 06 (p. 28), notifications are strictly handled via email logging (Node.js mailer / console logger). Third-party cellular hardware or chargeable SMS APIs (e.g. Twilio) are intentionally absent to ensure zero-cost reproducibility across evaluation environments.
- **Local Relational Storage:** Media assets are stored in the server filesystem (`backend/uploads/`) with relative URLs (`/uploads/...`) and static fallback SVG generators, avoiding vendor lock-in to external paid cloud object storage (e.g. AWS S3).
