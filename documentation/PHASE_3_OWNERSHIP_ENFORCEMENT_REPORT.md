# ESTATECORE PHASE 3: PROPERTY OWNERSHIP ENFORCEMENT REPORT
**Academic Context:** `estatecire.pdf` &mdash; Lab 04 (Database Schema) & Lab 06 (Access Control)  
**Verification Date:** 2026-11-25  
**Target Environment:** Isolated Sandbox Database (`estatecore_test_restore`)

---

## 1. Executive Summary

This report documents the verification of the **Property Owner Persona** in EstateCore. In accordance with architectural review:
- The platform does not introduce an artificial global role (e.g. `SELLER`).
- A property owner is a registered `CLIENT` whose `user.id` matches `properties.ownerId`.
- Ownership grants resource-level capabilities over the owned listing without leaking administrative rights.

---

## 2. Test Execution & Evidence

The automated security test suite (`scripts/test_phase3_security_suite.js`) executed the following end-to-end tests:

### Test Case 1: Owner Listing Creation (`OWNER-01`)
- **Actor:** Client Juan Dela Cruz (`userId = 4`, `role = 'CLIENT'`).
- **Endpoint:** `POST /api/v1/properties`.
- **Payload:**
  ```json
  {
    "title": "Juan Dela Cruz Ancestral Estate",
    "description": "Privately owned estate listed directly by owner",
    "price": 15500000,
    "location": "Alabang, Muntinlupa City",
    "address": "45 Acacia Avenue, Ayala Alabang",
    "propertyType": "HOUSE",
    "listingType": "SALE",
    "bedrooms": 4,
    "bathrooms": 3,
    "floorArea": 320,
    "lotArea": 450
  }
  ```
- **Result:** `201 Created`.
- **Integrity Verification:**
  - Property was assigned `ownerId = 4` automatically based on the authenticated JWT token.
  - `agentId` defaulted to `null` (no agent assigned).
  - City was automatically derived as `Muntinlupa`.

### Test Case 2: Owner Listing Modification (`OWNER-02`)
- **Actor:** Client Juan Dela Cruz (`userId = 4`).
- **Endpoint:** `PATCH /api/v1/properties/:id`.
- **Payload:** `{"description": "Updated description by verified property owner Juan"}`.
- **Result:** `200 OK`. The owner successfully modified their listing.

### Test Case 3: Unauthorized Cross-Client Modification (`OWNER-03`)
- **Actor:** Client Elena Roxas (`userId = 5`).
- **Endpoint:** `PATCH /api/v1/properties/:id` (targeting Juan's property).
- **Result:** `403 Forbidden`. The unauthorized client was blocked with message:
  `"You are not authorized to update properties owned by other users."`

### Test Case 4: Unauthorized Cross-Client Deletion (`OWNER-04`)
- **Actor:** Client Elena Roxas (`userId = 5`).
- **Endpoint:** `DELETE /api/v1/properties/:id` (targeting Juan's property).
- **Result:** `403 Forbidden`.

### Test Case 5: Unauthorized Cross-Client Photo Upload (`OWNER-05`)
- **Actor:** Client Elena Roxas (`userId = 5`).
- **Endpoint:** `POST /api/v1/properties/:id/photos` (targeting Juan's property).
- **Result:** `403 Forbidden`.

### Test Case 6: Authorized Owner Photo Upload (`OWNER-06`)
- **Actor:** Client Juan Dela Cruz (`userId = 4`).
- **Endpoint:** `POST /api/v1/properties/:id/photos`.
- **Payload:** `{"filePath": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", "isPrimary": true, "caption": "Main Facade"}`.
- **Result:** `201 Created`. Photo was attached to the property.

### Test Case 7: Privilege Escalation Prevention (`OWNER-07`)
- **Actor:** Client Juan Dela Cruz (`userId = 4`).
- **Endpoint:** `PATCH /api/v1/properties/:id`.
- **Payload:** `{"ownerId": 5, "agentId": 1}`.
- **Result:** `403 Forbidden`. The service strictly forbids non-administrators from reassigning property ownership or agency management.

### Test Case 8: Authorized Owner Listing Deletion (`OWNER-08`)
- **Actor:** Client Juan Dela Cruz (`userId = 4`).
- **Endpoint:** `DELETE /api/v1/properties/:id`.
- **Result:** `200 OK`. The owner successfully deleted their listing.

---

## 3. Conclusion

Resource-level ownership enforcement is verified and operates as a strict capability tier within the `CLIENT` persona, meeting 100% of the academic specifications without creating schema anomalies or role proliferation.
