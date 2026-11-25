# EstateCore Phase 4.0 &mdash; Frontend Authorization Remediation Report

**Phase:** 4.0 &mdash; Frontend Authorization Remediation  
**Academic Source of Truth:** `estatecire.pdf` (Labs 03, 04, 05, 06)  
**Branch:** `feature/phase4-frontend-authorization-remediation`  
**Base Commit:** `c3d82d9810b3e1f2dd0bad63507efcd0b9919d92`  
**Date:** November 25, 2026  
**Auditor:** Application Security Engineer & Senior Full-Stack Architect  

---

## 1. Executive Summary

During the Phase 3 independent audit, a critical authorization defect was identified in the React frontend: the property edit guard compared an agent entity ID (`properties.agentId` pointing to `agents.id`) directly with an authenticated user ID (`user.id` pointing to `users.id`). Because Maria Santos has `users.id = 2` and `agents.id = 1`, and Carlos Reyes has `users.id = 3` and `agents.id = 2`, any property assigned to Carlos Reyes (`agentId = 2`) evaluated `prop.agentId === user.id` as `2 === 2`, causing the frontend to falsely identify Maria Santos as the authorized listing agent. Conversely, Carlos Reyes (`user.id = 3`) was blocked or denied ownership recognition on his own listings (`prop.agentId = 2`).

In Phase 4.0, this identity collision defect was thoroughly investigated, remediated across all relevant frontend components, and validated via end-to-end browser regression testing.

---

## 2. Root Cause Analysis

### 2.1 The Two-Tier Identity Model
In Phase 2 and Phase 3, the EstateCore data model was restructured according to Lab 04 of `estatecire.pdf`:
1. `users` table: Base authentication identity (`id`, `email`, `role`, `password`, etc.).
2. `agents` table: Domain profile linked to a user (`id`, `userId` -> `users.id`, `licenseNumber`, etc.).
3. `properties` table: Physical real estate listings (`id`, `agentId` -> `agents.id`, `ownerId` -> `users.id`).

### 2.2 The Defect in Detail
When the NestJS backend handles `GET /api/v1/properties/:id`, it eagerly loads relations:
```typescript
relations: ['agent', 'agent.user', 'photos', 'owner']
```
The returned JSON payload presents:
```json
{
  "id": 3,
  "title": "Modern Townhouse",
  "agentId": 2,
  "agent": {
    "id": 2,
    "userId": 3,
    "licenseNumber": "PRC-REB-0045678",
    "user": {
      "id": 3,
      "email": "carlos.reyes@estatecore.com",
      "firstName": "Carlos",
      "lastName": "Reyes",
      "role": "AGENT"
    }
  },
  "ownerId": null
}
```

Prior to remediation:
- `PropertyForm.tsx` executed:
  ```typescript
  if (user?.role === 'AGENT' && prop.agentId !== user.id) {
    navigate('/properties');
  }
  ```
- Because Carlos's `prop.agentId` is `2`, and Maria's `user.id` is `2`:
  - `prop.agentId !== user.id` &rarr; `2 !== 2` &rarr; `false`.
  - The redirect did **NOT** trigger! Maria was allowed to enter the edit form of Carlos's listing.
  - If Carlos (`user.id = 3`) entered, `2 !== 3` &rarr; `true`, causing Carlos to be redirected away from his own listing!

Furthermore, this identical integer comparison defect was discovered in two additional components:
- `PropertiesList.tsx` (line 443): Dictated whether the "Edit" action button rendered in the table/cards.
- `PropertyDetail.tsx` (line 145): Dictated whether the "Edit Property" header button rendered on the detail view.

---

## 3. Detailed Code Remediation

### 3.1 TypeScript Type Definitions (`frontend/src/types/index.ts`)
Updated the `Property` interface to formally type the populated `agent` relationship, its inner `userId`, and the `ownerId` foreign key.

```diff
--- a/frontend/src/types/index.ts
+++ b/frontend/src/types/index.ts
@@ -35,7 +35,14 @@ export interface Property {
   status: 'AVAILABLE' | 'UNDER_CONTRACT' | 'SOLD';
   imageUrl?: string;
   agentId?: number;
-  agent?: User;
+  agent?: {
+    id: number;
+    fullName?: string;
+    email?: string;
+    userId?: number;
+    user?: User;
+  };
+  ownerId?: number | null;
   owner?: User;
   photos?: PropertyPhoto[];
   createdAt: string;
```

### 3.2 Property Form Component (`frontend/src/pages/PropertyForm.tsx`)
Replaced the direct foreign-key-to-user comparison with safe user-ID extraction from the nested agent entity, enforcing a **fail-closed** policy if agent profile linkage is absent.

```diff
--- a/frontend/src/pages/PropertyForm.tsx
+++ b/frontend/src/pages/PropertyForm.tsx
@@ -70,7 +70,8 @@ export const PropertyForm: React.FC = () => {
             ...
           };
           setFormData(loaded);
-          if (user?.role === 'AGENT' && prop.agentId !== user.id) {
+          const assignedAgentUserId = prop.agent?.userId ?? prop.agent?.user?.id;
+          if (user?.role === 'AGENT' && (!assignedAgentUserId || assignedAgentUserId !== user.id)) {
             navigate('/properties');
           }
```

### 3.3 Properties List Component (`frontend/src/pages/PropertiesList.tsx`)
Remediated the ownership computation for catalog action buttons:

```diff
--- a/frontend/src/pages/PropertiesList.tsx
+++ b/frontend/src/pages/PropertiesList.tsx
@@ -440,7 +440,8 @@ export const PropertiesList: React.FC = () => {
             return (
               <div key={prop.id} ...>
                 ...
-                const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && prop.agentId === user.id) || (user?.role === 'CLIENT' && prop.ownerId === user.id);
+                const assignedAgentUserId = prop.agent?.userId ?? prop.agent?.user?.id;
+                const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && assignedAgentUserId === user.id) || (user?.role === 'CLIENT' && prop.ownerId === user.id);
```

### 3.4 Property Detail Component (`frontend/src/pages/PropertyDetail.tsx`)
Remediated the header edit button visibility check:

```diff
--- a/frontend/src/pages/PropertyDetail.tsx
+++ b/frontend/src/pages/PropertyDetail.tsx
@@ -142,7 +142,8 @@ export const PropertyDetail: React.FC = () => {
   const assignedAgentUserId = property.agent?.userId ?? property.agent?.user?.id;
   const isOwner = user?.role === 'ADMIN' || 
-    (user?.role === 'AGENT' && property.agentId === user.id) || 
+    (user?.role === 'AGENT' && assignedAgentUserId === user.id) || 
     (user?.role === 'CLIENT' && property.ownerId === user.id);
```

---

## 4. Architectural Principles Enforced

1. **Fail-Closed Security Posture:**
   If `prop.agent?.userId` and `prop.agent?.user?.id` are undefined (e.g. malformed payload or unassigned listing), `!assignedAgentUserId` evaluates to `true`, instantly denying access to an AGENT user.
2. **Defensive Null Coalescing:**
   Supports both direct foreign key projection (`prop.agent.userId`) and deeply nested relation projection (`prop.agent.user.id`).
3. **Preservation of Existing Visual UI & Layout:**
   Zero changes to DOM element structures, Tailwind CSS classes, responsive breakpoints, or navigation routing guards.
4. **Zero Backend Regression:**
   Backend controllers and services already enforce strict BOLA (`agent.userId === req.user.id`). This remediation ensures frontend presentation and routing reflect backend security invariants with 100% fidelity.
