# ESTATECORE &mdash; RELATIONSHIP INTEGRITY AUDIT (PHASE 2.2)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf` (Lab 04)  
**Milestone:** Phase 2.2 &mdash; Foreign Key Target Verification & Appointment Migration Proposal  
**Date:** November 25, 2026  
**Auditor:** Antigravity Engineering Agent

---

## 1. Foreign Key Target Mapping Audit

An exhaustive audit of the `information_schema.KEY_COLUMN_USAGE` catalog was performed in the sandbox database `estatecore_test_restore` following migration:

| Source Table | Foreign Key Column | Constraint Name | Referenced Table | Referenced Column | Delete Action | Architectural Status |
|---|---|---|---|---|:---:|:---:|
| `properties` | `agentId` | `FK_properties_agentId` | **`agents`** | `id` | `SET NULL` | **ACADEMIC COMPLIANT** |
| `properties` | `ownerId` | `FK_properties_ownerId` | **`users`** | `id` | `SET NULL` | **ACADEMIC COMPLIANT** |
| `property_photos` | `propertyId` | `FK_property_photos_propertyId` | **`properties`** | `id` | `CASCADE` | **ACADEMIC COMPLIANT** |
| `property_transactions` | `propertyId` | `FK_transactions_propertyId` | **`properties`** | `id` | `RESTRICT` | **ACADEMIC COMPLIANT** |
| `property_transactions` | `buyerId` | `FK_transactions_buyerId` | **`users`** | `id` | `RESTRICT` | **ACADEMIC COMPLIANT** |
| `property_transactions` | `agentId` | `FK_transactions_agentId` | **`agents`** | `id` | `RESTRICT` | **ACADEMIC COMPLIANT** |
| `inquiries` | `propertyId` | `FK_inquiries_propertyId` | **`properties`** | `id` | **`RESTRICT`** | **ACADEMIC COMPLIANT** |
| `inquiries` | `clientId` | `FK_inquiries_clientId` | **`users`** | `id` | **`RESTRICT`** | **ACADEMIC COMPLIANT** |
| `inquiries` | `assignedAgentId`| `FK_inquiries_assignedAgentId` | **`users`** | `id` | `SET NULL` | **APPLICATION EXTENSION** |
| `appointments` | `propertyId` | `FK_appointments_propertyId` | **`properties`** | `id` | `CASCADE` | **SUPPLEMENTAL MODULE** |
| `appointments` | `clientId` | `FK_appointments_clientId` | **`users`** | `id` | `CASCADE` | **SUPPLEMENTAL MODULE** |
| `appointments` | `agentId` | `FK_appointments_agentId` | **`users`** | `id` | `CASCADE` | **SUPPLEMENTAL MODULE (LEGACY FK)** |

---

## 2. The Appointment & Inquiry Relationship Duality

### 2.1 The Issue
The academic ERD depicts that an `Agent` hosts an `Appointment`, while in the physical MySQL schema:
- `appointments.agentId` references **`users.id`**.
- `inquiries.assignedAgentId` references **`users.id`**.

### 2.2 Why This Duality Exists
1. **Appointment is a supplemental module:** Lab 04 of `estatecire.pdf` specifies exactly six entities (`User`, `Agent`, `Property`, `PropertyPhoto`, `Inquiry`, `PropertyTransaction`). The `Appointment` module was added by EstateCore to support viewing tour bookings.
2. **Inquiry Agent Routing is an application extension:** In Lab 04, `Inquiry` has only `InquiryID`, `PropertyID`, `UserID`, `InquiryType`, `Message`, `OfferAmount`, `Status`, `DateSent`. It does not have an `assignedAgentId` column in the academic PDF.
3. **Application stability:** In the existing React frontend, appointments and inquiry notifications join directly against the user profile (retrieving the user's name, email, and avatar). Retaining `users.id` prevented breaking the existing appointments UI.

---

## 3. Safe Sandbox Migration Proposal: Transitioning Appointments & Inquiries to `agents.id`

If the human reviewers require `appointments.agentId` and `inquiries.assignedAgentId` to reference `agents.id` for conceptual purity, the following reversible sandbox migration procedure is prepared:

### Proposed Schema Changes:
1. **Appointments Table:**
   ```sql
   -- Map existing appointments.agentId from users.id to agents.id
   ALTER TABLE `appointments` DROP FOREIGN KEY `FK_appointments_agentId`;
   
   -- Appointment 1, 5, 6 (Maria Santos users.id=2) -> agents.id=1
   -- Appointment 2 (Carlos Reyes users.id=3) -> agents.id=2
   UPDATE `appointments` apt
   JOIN `agents` a ON apt.`agentId` = a.`userId`
   SET apt.`agentId` = a.`id`;
   
   ALTER TABLE `appointments`
   ADD CONSTRAINT `FK_appointments_agentId` FOREIGN KEY (`agentId`) REFERENCES `agents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
   ```
2. **Inquiries Table:**
   ```sql
   ALTER TABLE `inquiries` DROP FOREIGN KEY `FK_inquiries_assignedAgentId`;
   
   UPDATE `inquiries` inq
   JOIN `agents` a ON inq.`assignedAgentId` = a.`userId`
   SET inq.`assignedAgentId` = a.`id`;
   
   ALTER TABLE `inquiries`
   ADD CONSTRAINT `FK_inquiries_assignedAgentId` FOREIGN KEY (`assignedAgentId`) REFERENCES `agents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
   ```

### Risk & Impact Assessment
- **Existing Appointments Affected:** Exactly 4 appointments (IDs 1, 2, 5, 6).
  - Appointments 1, 5, 6 (`agentId: 2` &rarr; `agentId: 1`).
  - Appointment 2 (`agentId: 3` &rarr; `agentId: 2`).
  - Orphaned appointments: **0**.
- **Backend / Frontend Impact:** If executed, `Appointment` entity in NestJS would change `@ManyToOne(() => User)` to `@ManyToOne(() => Agent)`. The frontend appointment view would need to access `appointment.agent.user.fullName` instead of `appointment.agent.fullName`.
- **Recommendation:** **Do not execute this migration on live database without explicit human approval.** For Phase 2, keeping `appointments.agentId` referencing `users.id` preserves 100% backward compatibility and guarantees 0 UI regressions.
