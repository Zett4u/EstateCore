# ESTATECORE &mdash; RELATIONSHIP & FOREIGN KEY MAPPING REPORT (PHASE 2D)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf` (Lab 04)  
**Milestone:** Phase 2D &mdash; Foreign Key Transition & Separation of Ownership  
**Date:** November 24, 2026  
**Implementation Branch:** `feature/phase2-database-sandbox`

---

## 1. The Core Architectural Challenge

In the legacy EstateCore schema:
- Properties referenced `users.id` directly via `properties.agentId`.
- No `Agent` table existed.
- No `OwnerID` existed, conflating ownership and agency representation.

Lab 04 of `estatecire.pdf` explicitly requires:
1. `User` (1) &mdash; (1) `Agent` (User has one Agent profile).
2. `Property.AgentID` references `Agent.AgentID` (not `User.UserID`).
3. `Property.OwnerID` references `User.UserID` (legal title ownership).

---

## 2. Verified Agent Profile Mapping

Existing agent users in the system were identified and mapped into the new `agents` table:

| User ID | Full Name | Email | Original Role | Mapped Agent ID | License Number | Agency Name | Verification Status |
|:---:|---|---|:---:|:---:|:---:|---|:---:|
| **2** | Maria Santos | `maria.santos@estatecore.local` | `AGENT` | **1** | `NULL` | EstateCore Realty | `PENDING_VERIFICATION` |
| **3** | Carlos Reyes | `carlos.reyes@estatecore.local` | `AGENT` | **2** | `NULL` | EstateCore Realty | `PENDING_VERIFICATION` |

> [!NOTE]
> In strict accordance with human review instructions, **no fake or fabricated PRC license numbers were generated**. Both agent profiles remain `PENDING_VERIFICATION` with `licenseNumber = NULL` until authentic credentials are submitted.

---

## 3. Property Assignment Mapping Matrix

All properties in the portfolio were transitioned from referencing `users.id` to referencing `agents.id`:

| Property ID | Property Title | Old Agent Reference (`users.id`) | New Agent Reference (`agents.id`) | Assigned Agent Name | Legal Owner Reference (`OwnerID`) |
|:---:|---|:---:|:---:|---|:---:|
| **1** | Modern High-Rise Condominium in BGC | 2 | **1** | Maria Santos | `NULL` (Pending Deed) |
| **2** | Spacious 4-Bedroom Suburban Family Home | 2 | **1** | Maria Santos | `NULL` (Pending Deed) |
| **3** | Prime Commercial Corner Lot for Development | 3 | **2** | Carlos Reyes | `NULL` (Pending Deed) |
| **4** | Contemporary 3-Storey Townhouse | 3 | **2** | Carlos Reyes | `NULL` (Pending Deed) |
| **5** | Cozy Studio Apartment in Makati CBD | 2 | **1** | Maria Santos | `NULL` (Pending Deed) |
| **6** | Scenic Agricultural & Residential Land | 3 | **2** | Carlos Reyes | `NULL` (Pending Deed) |
| **17** | Regency Villa 1795514688896 (Test Property) | 1 (Admin) | **1** | Maria Santos | `NULL` (Pending Deed) |
| **18** | Regency Villa 1795517488018 (Test Property) | 1 (Admin) | **1** | Maria Santos | `NULL` (Pending Deed) |

### Orphan Record Validation
- **Properties with invalid/unmapped AgentID:** **0**
- **Orphaned foreign keys:** **0**
- **Properties with unverified OwnerID:** `OwnerID` safely set to `NULL` (column is defined as `INT NULL`).

---

## 4. Preservation of Existing Appointment Relationships

EstateCore’s supplemental viewing appointment feature links clients, properties, and agents.

To prevent breaking appointments during this transition:
- `appointments.agentId` retains its direct foreign key constraint referencing `users.id` (`FK_appointments_agentId`).
- This guarantees that client appointments (such as Appointment ID 1 for Maria Santos on Dec 5, 2026, and Appointment ID 2 for Carlos Reyes on Dec 7, 2026) remain 100% functional in existing user dashboards without any runtime errors.
