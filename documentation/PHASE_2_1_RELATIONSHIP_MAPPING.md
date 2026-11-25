# ESTATECORE &mdash; CORRECTED RELATIONSHIP & AGENT MAPPING MATRIX (PHASE 2.1)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf` (Lab 04)  
**Milestone:** Phase 2.1 &mdash; Rectification of Admin-to-Agent Foreign Key Mapping  
**Date:** November 25, 2026  
**Implementation Branch:** `feature/phase2-database-sandbox`

---

## 1. Problem Statement & Root Cause

In the initial Phase 2 migration, properties with an original `agentId = 1` (referencing Administrator User ID 1) inadvertently retained `agentId = 1` after `agents` table creation. Because Maria Santos (`users.id = 2`) was assigned `agents.id = 1` as the first auto-incremented agent, properties 17 and 18 appeared mistakenly assigned to Maria Santos.

This was an unintended integer collision. An administrator is not an agent, and unassigned or admin-listed properties must never be attributed to an agent without legal agency engagement.

---

## 2. Corrected Mapping Strategy

The migration script [`1700000000001-Phase2AcademicSchemaAlignment.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/database/migrations/1700000000001-Phase2AcademicSchemaAlignment.ts) was updated with a two-step temporary column transition:
1. Copy original `properties.agentId` to `_oldAgentUserId`.
2. Clear all `properties.agentId` values to `NULL`.
3. Only update `properties.agentId` where `_oldAgentUserId` matches a verified record in `agents.userId`.
4. Properties whose original assignment was not an agent (such as User ID 1 Admin) remain strictly `NULL`.

---

## 3. Verified Property Assignment Matrix

| Property ID | Property Title | Original `agentId` (`users.id`) | Original User Identity | New `agentId` (`agents.id`) | Assigned Agent Name | Legal Owner (`ownerId`) | Status |
|:---:|---|:---:|---|:---:|---|:---:|:---:|
| **1** | Modern High-Rise Condominium in BGC | 2 | Maria Santos (`AGENT`) | **1** | Maria Santos | `NULL` | **VALID AGENT MAPPING** |
| **2** | Spacious 4-Bedroom Suburban Family Home | 2 | Maria Santos (`AGENT`) | **1** | Maria Santos | `NULL` | **VALID AGENT MAPPING** |
| **3** | Prime Commercial Corner Lot for Development | 3 | Carlos Reyes (`AGENT`) | **2** | Carlos Reyes | `NULL` | **VALID AGENT MAPPING** |
| **4** | Contemporary 3-Storey Townhouse | 3 | Carlos Reyes (`AGENT`) | **2** | Carlos Reyes | `NULL` | **VALID AGENT MAPPING** |
| **5** | Cozy Studio Apartment in Makati CBD | 2 | Maria Santos (`AGENT`) | **1** | Maria Santos | `NULL` | **VALID AGENT MAPPING** |
| **6** | Scenic Agricultural & Residential Land | 3 | Carlos Reyes (`AGENT`) | **2** | Carlos Reyes | `NULL` | **VALID AGENT MAPPING** |
| **17** | Regency Villa 1795514688896 | 1 | System Administrator (`ADMIN`) | **`NULL`** | *Unassigned* | `NULL` | **RECTIFIED: UNASSIGNED** |
| **18** | Regency Villa 1795517488018 | 1 | System Administrator (`ADMIN`) | **`NULL`** | *Unassigned* | `NULL` | **RECTIFIED: UNASSIGNED** |

---

## 4. Agent Profile Mapping Verification

| Agent ID | User ID | Linked User Full Name | Role | License Number | Verification Status | Agency Name |
|:---:|:---:|---|:---:|:---:|:---:|---|
| **1** | **2** | Maria Santos | `AGENT` | `NULL` | `PENDING_VERIFICATION` | EstateCore Realty |
| **2** | **3** | Carlos Reyes | `AGENT` | `NULL` | `PENDING_VERIFICATION` | EstateCore Realty |

- **User 1 (Admin) mapped to Agent:** **NO** (User 1 has 0 Agent records).
- **Fabricated PRC Licenses:** **0** (Both remain `NULL`).
- **Orphaned Properties:** **0** (Properties 17 and 18 have valid `NULL` foreign keys).
