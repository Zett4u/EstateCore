# ESTATECORE &mdash; PHASE 1: API ENDPOINT MATRIX

**Academic Reference:** `estatecire.pdf` &mdash; Laboratory Activity 05 (RESTful API Design)  
**Milestone:** Phase 1 &mdash; API Contract Alignment and Backward Compatibility  
**Audited Target:** Live Backend (`http://127.0.0.1:3000`)  
**Evidence Source:** [`documentation/evidence/phase_1_api_test_results.json`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/phase_1_api_test_results.json)

---

## 1. Master Endpoint Specification & Test Matrix

| Req ID | HTTP Method | Canonical Path (`/api/v1`) | Legacy Alias (`/api`) | Authentication | Authorized Roles | Request Payload / Params | Expected Response Structure | Phase 1 Test Result | Status |
|:---:|:---:|---|---|:---:|:---:|---|---|:---:|:---:|
| **EP-01** | `POST` | `/api/v1/auth/register` | `/api/auth/register` | None | Public | `fullName`, `email`, `password` | `{ message, accessToken, user: { id, fullName, email, role, isActive } }` | `201 Created` | **IMPLEMENTED AND TESTED** |
| **EP-02** | `POST` | `/api/v1/auth/login` | `/api/auth/login` | None | Public | `email`, `password` | `{ message, accessToken, user: { id, fullName, email, role, isActive } }` | `200 OK` (3600s JWT) | **IMPLEMENTED AND TESTED** |
| **EP-03** | `POST` | `/api/v1/auth/logout` | `/api/auth/logout` | Bearer JWT | Authenticated | None | `{ success: true, statusCode: 200, message: "User logged out successfully. Session token revoked." }` | `200 OK` (401 on reuse) | **IMPLEMENTED AND TESTED** |
| **EP-04** | `GET` | `/api/v1/users` | `/api/users` | Bearer JWT | `ADMIN` | Query: `role`, `isActive` | `User[]` | `200 OK` (403 for Client) | **IMPLEMENTED AND TESTED** |
| **EP-05** | `GET` | `/api/v1/users/:id` | `/api/users/:id` | Bearer JWT | `ADMIN` or Self | Param: `id` | `User` | `200 OK` (403 for SNOOP) | **IMPLEMENTED AND TESTED** |
| **EP-06** | `PUT` & `PATCH` | `/api/v1/users/:id` | `/api/users/:id` | Bearer JWT | `ADMIN` or Self | Param: `id`, Body: `UpdateUserDto` | `User` | `200 OK` (Both verbs) | **IMPLEMENTED AND TESTED** |
| **EP-07** | `DELETE` | `/api/v1/users/:id` | `/api/users/:id` | Bearer JWT | `ADMIN` | Param: `id` | `{ message, id }` | `200 OK` / `404 Not Found` | **IMPLEMENTED AND TESTED** |
| **EP-08** | `GET` | `/api/v1/agents` | `/api/agents` | None | Public / Auth | None | `AgentResponse[]` (`verificationStatus = PENDING_VERIFICATION`) | `200 OK` | **IMPLEMENTED AND TESTED** |
| **EP-09** | `GET` | `/api/v1/agents/:id` | `/api/agents/:id` | None | Public / Auth | Param: `id` | `AgentResponse` | `200 OK` | **IMPLEMENTED AND TESTED** |
| **EP-10** | `POST` | `/api/v1/agents` | `/api/agents` | Bearer JWT | `ADMIN` | Body: `CreateAgentDto` (`userId`, `agencyName`, `licenseNumber`) | `AgentResponse` | `403 Forbidden` (Client blocked) | **IMPLEMENTED AND TESTED** |
| **EP-11** | `PUT` & `PATCH` | `/api/v1/agents/:id` | `/api/agents/:id` | Bearer JWT | `ADMIN` or Self Agent | Param: `id`, Body: `UpdateAgentDto` | `AgentResponse` | `200 OK` | **IMPLEMENTED AND TESTED** |
| **EP-12** | `GET` | `/api/v1/properties` | `/api/properties` | None | Public | Query: `search`, `type`, `status`, `minPrice`, `maxPrice` | `Property[]` | `200 OK` | **IMPLEMENTED AND TESTED** |
| **EP-13** | `GET` | `/api/v1/properties/:id` | `/api/properties/:id` | None | Public | Param: `id` | `Property` | `200 OK` | **IMPLEMENTED AND TESTED** |
| **EP-14** | `POST` | `/api/v1/properties` | `/api/properties` | Bearer JWT | `ADMIN`, `AGENT` | Body: `CreatePropertyDto` | `Property` | `201 Created` / `400 Validation` | **IMPLEMENTED AND TESTED** |
| **EP-15** | `PUT` & `PATCH` | `/api/v1/properties/:id` | `/api/properties/:id` | Bearer JWT | Assigned `AGENT`, `ADMIN` | Param: `id`, Body: `UpdatePropertyDto` | `Property` | `200 OK` (Both verbs) | **IMPLEMENTED AND TESTED** |
| **EP-16** | `DELETE` | `/api/v1/properties/:id` | `/api/properties/:id` | Bearer JWT | Assigned `AGENT`, `ADMIN` | Param: `id` | `{ message, id }` | `200 OK` / `403 Forbidden` | **IMPLEMENTED AND TESTED** |
| **EP-17** | `POST` | `/api/v1/properties/:id/photos` | `/api/properties/:id/photos` | Bearer JWT | Assigned `AGENT`, `ADMIN` | Param: `id`, Body: `{ photoUrl, isPrimary }` | `{ photoId, propertyId, photoUrl, isPrimary, uploadDate }` | `201 Created` (403 Client) | **IMPLEMENTED AND TESTED** |
| **EP-18** | `POST` | `/api/v1/properties/:id/inquiries` | `/api/properties/:id/inquiries` | Bearer JWT | Authenticated Client | Param: `id`, Body: `CreateInquiryDto` | `Inquiry` | `201 Created` | **IMPLEMENTED AND TESTED** |
| **EP-19** | `GET` | `/api/v1/transactions` | `/api/transactions` | Bearer JWT | Authenticated (`ADMIN`, `AGENT`, `CLIENT`) | Query: `propertyId` | `PropertyTransactionResponse[]` | `200 OK` (401 unauth) | **IMPLEMENTED AND TESTED** |

---

## 2. Complementary Operational Endpoints (Preserved Enhancements)

The following operational endpoints are preserved to maintain complete functionality for viewing tours and legacy inquiries:

| Endpoint | Method | Path | Authentication | Description |
|---|:---:|---|:---:|---|
| **Root Inquiries** | `POST` | `/api/v1/inquiries` & `/api/inquiries` | Bearer JWT | Direct inquiry creation by propertyId |
| **Inquiry List** | `GET` | `/api/v1/inquiries` & `/api/inquiries` | Bearer JWT | User's inquiries center |
| **Inquiry Detail** | `GET` | `/api/v1/inquiries/:id` | Bearer JWT | Single inquiry dossier |
| **Inquiry Status** | `PATCH` | `/api/v1/inquiries/:id` | Bearer JWT | Update inquiry status |
| **Appointments Book** | `POST` | `/api/v1/appointments` & `/api/appointments` | Bearer JWT | Book viewing tour schedule |
| **Appointments List** | `GET` | `/api/v1/appointments` & `/api/appointments` | Bearer JWT | User's viewing tours |
| **Appointments Cancel**| `DELETE`| `/api/v1/appointments/:id` | Bearer JWT | Cancel viewing tour |
| **User Profile Self** | `GET` | `/api/v1/auth/me` & `/api/auth/me` | Bearer JWT | Return authenticated profile |
