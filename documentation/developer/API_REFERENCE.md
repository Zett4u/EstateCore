# EstateCore Developer Guide: Complete REST API Reference

**Project:** EstateCore — Real Estate Management System  
**Canonical Base URL:** `http://localhost:3000/api/v1`  
**Legacy Alias Base URL:** `http://localhost:3000/api` (Transparent rewrite)  
**Authentication Scheme:** Bearer Token (JWT in `Authorization: Bearer <token>` header)  
**Academic Requirement:** Minimum 20 REST Endpoints (`09_Final_Project_Student_Copy.pdf`)  
**Actual Distinct Controller Routes:** **39 Unique Routes** across 7 Controllers  
**Automated Endpoint Tests:** 41 Invocations + 5 Security Checks = 46 Total Checks in `test_final_project_36_endpoints.js`  

---

## 1. Authentication & Session Management (`/api/v1/auth`)

### 1.1 Register Client Account
- **Method:** `POST`
- **Route:** `/api/v1/auth/register`
- **Controller Method:** `AuthController.register(@Body() dto: RegisterDto)`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "newclient@example.com",
    "password": "Password123!",
    "fullName": "Juan Dela Cruz",
    "contactNumber": "09171234567"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "user": {
      "id": 16,
      "email": "newclient@example.com",
      "fullName": "Juan Dela Cruz",
      "role": "CLIENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Codes:** `400 Bad Request` (validation failed), `409 Conflict` (email already registered).
- **Test ID:** `EP-01`

### 1.2 User Login
- **Method:** `POST`
- **Route:** `/api/v1/auth/login`
- **Controller Method:** `AuthController.login(@Body() dto: LoginDto)`
- **Auth:** Public (Rate-limited: 5 consecutive failures triggers `429 Too Many Requests`)
- **Request Body:**
  ```json
  {
    "email": "admin@estatecore.local",
    "password": "Password123!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@estatecore.local",
      "role": "ADMIN",
      "fullName": "System Administrator"
    }
  }
  ```
- **Error Codes:** `400 Bad Request`, `401 Unauthorized` (invalid credentials), `429 Too Many Requests`.
- **Test IDs:** `EP-02` (Admin), `EP-03` (Agent Maria), `EP-04` (Client Juan).

### 1.3 Server-Side Logout (Revoke Token)
- **Method:** `POST`
- **Route:** `/api/v1/auth/logout`
- **Controller Method:** `AuthController.logout(@Req() req)`
- **Auth:** Authenticated (Any valid token)
- **Database / Memory Effect:** Token is added to `TokenBlacklistService`; future requests with this token return `401 Unauthorized`.
- **Success Response (`200 OK`):**
  ```json
  { "message": "Logged out successfully" }
  ```
- **Error Codes:** `401 Unauthorized`.
- **Test ID:** `EP-06`

### 1.4 Get Current User Profile
- **Method:** `GET`
- **Route:** `/api/v1/auth/me`
- **Controller Method:** `AuthController.getProfile(@Req() req)`
- **Auth:** Authenticated
- **Success Response (`200 OK`):** User object matching token subject.
- **Test ID:** `EP-05`

---

## 2. Users Management (`/api/v1/users`)

### 2.1 Create User Account
- **Method:** `POST` | **Route:** `/api/v1/users` | **Auth:** Public / Admin | **Success:** `201 Created`
- **Body:** `{ "email": "user@example.com", "password": "Password123!", "role": "CLIENT", "fullName": "Jane Doe" }`
- **Test ID:** `EP-08`

### 2.2 List Users
- **Method:** `GET` | **Route:** `/api/v1/users?role=AGENT` | **Auth:** `ADMIN` only | **Success:** `200 OK`
- **Test ID:** `EP-07`

### 2.3 Get User by ID
- **Method:** `GET` | **Route:** `/api/v1/users/:id` | **Auth:** Admin or Self | **Success:** `200 OK` | **Errors:** `403 Forbidden` (BOLA protection)
- **Test ID:** `EP-09`

### 2.4 Complete Profile Update (PUT)
- **Method:** `PUT` | **Route:** `/api/v1/users/:id` | **Auth:** Admin or Self | **Success:** `200 OK`
- **Test ID:** `EP-11`

### 2.5 Partial Profile Update (PATCH)
- **Method:** `PATCH` | **Route:** `/api/v1/users/:id` | **Auth:** Admin or Self | **Success:** `200 OK`
- **Test ID:** `EP-10`

### 2.6 Deactivate User Account
- **Method:** `DELETE` | **Route:** `/api/v1/users/:id` | **Auth:** `ADMIN` only | **Success:** `204 No Content`
- **Effect:** Sets `isActive = false` (soft delete preserving relational history).
- **Test ID:** `EP-12`

---

## 3. Agents Directory & Profiles (`/api/v1/agents`)

### 3.1 Public Agents Directory
- **Method:** `GET` | **Route:** `/api/v1/agents` | **Auth:** Public | **Success:** `200 OK`
- **Test ID:** `EP-13`

### 3.2 Get Agent Profile
- **Method:** `GET` | **Route:** `/api/v1/agents/:id` | **Auth:** Public | **Success:** `200 OK`
- **Test ID:** `EP-14`

### 3.3 Create Agent Profile
- **Method:** `POST` | **Route:** `/api/v1/agents` | **Auth:** Admin or Agent | **Success:** `201 Created` | **Errors:** `409 Conflict` (profile exists)
- **Body:** `{ "agencyName": "Metro Manila Realty", "licenseNumber": "PRC-009988", "bio": "Specialist in BGC condos" }`
- **Test ID:** `EP-15`

### 3.4 Full Update Agent Profile (PUT)
- **Method:** `PUT` | **Route:** `/api/v1/agents/:id` | **Auth:** Admin or Agent Self | **Success:** `200 OK`
- **Test ID:** `EP-17`

### 3.5 Partial Update Agent Profile (PATCH)
- **Method:** `PATCH` | **Route:** `/api/v1/agents/:id` | **Auth:** Admin or Agent Self | **Success:** `200 OK`
- **Test ID:** `EP-16`

---

## 4. Properties & Media Listings (`/api/v1/properties`)

### 4.1 Browse Property Catalog
- **Method:** `GET` | **Route:** `/api/v1/properties?propertyType=CONDOMINIUM&listingType=SALE&minPrice=1000000`
- **Auth:** Public | **Success:** `200 OK`
- **Test ID:** `EP-18`

### 4.2 Get Single Property Details
- **Method:** `GET` | **Route:** `/api/v1/properties/:id` | **Auth:** Public | **Success:** `200 OK`
- **Test ID:** `EP-19`

### 4.3 Create Listing
- **Method:** `POST` | **Route:** `/api/v1/properties`
- **Auth:** `ADMIN`, `AGENT` (assigned via `agents.id`), `CLIENT` (legal owner via `ownerId`)
- **Body:**
  ```json
  {
    "title": "Modern Ayala Penthouse",
    "description": "High-ceiling luxury condo with panoramic skyline view",
    "propertyType": "CONDOMINIUM",
    "listingType": "SALE",
    "price": 28000000,
    "location": "Makati City",
    "address": "6789 Ayala Avenue",
    "bedrooms": 3,
    "bathrooms": 3,
    "floorArea": 210,
    "lotArea": 0
  }
  ```
- **Success:** `201 Created` | **Test ID:** `EP-20`

### 4.4 Full Property Replacement (PUT)
- **Method:** `PUT` | **Route:** `/api/v1/properties/:id` | **Auth:** Admin, Assigned Agent, Legal Owner | **Success:** `200 OK`
- **Test ID:** `EP-22`

### 4.5 Partial Property Update (PATCH)
- **Method:** `PATCH` | **Route:** `/api/v1/properties/:id` | **Auth:** Admin, Assigned Agent, Legal Owner | **Success:** `200 OK`
- **Test ID:** `EP-21`

### 4.6 Delete Property Listing
- **Method:** `DELETE` | **Route:** `/api/v1/properties/:id` | **Auth:** Admin, Assigned Agent, Legal Owner
- **Relational Defense:** Throws `409 Conflict` if active transaction settlements exist; blocked by `RESTRICT` if active inquiries exist.
- **Success:** `200 OK` | **Test ID:** `EP-28`

### 4.7 Retrieve Property Photos
- **Method:** `GET` | **Route:** `/api/v1/properties/:id/photos` | **Auth:** Public | **Success:** `200 OK`
- **Test ID:** `EP-24`

### 4.8 Attach Photographic Asset
- **Method:** `POST` | **Route:** `/api/v1/properties/:id/photos` | **Auth:** Admin or Assigned Agent
- **Body / Multipart:** `{ "filePath": "/uploads/properties/penthouse.jpg", "isPrimary": true }`
- **Success:** `201 Created` | **Errors:** `400 Bad Request` (missing path or path traversal), `403 Forbidden` (cross-agent)
- **Test ID:** `EP-23`

### 4.9 Submit Nested Client Inquiry
- **Method:** `POST` | **Route:** `/api/v1/properties/:id/inquiries` | **Auth:** `CLIENT` | **Success:** `201 Created`
- **Test ID:** `EP-25`

### 4.10 Get Inquiries for Property
- **Method:** `GET` | **Route:** `/api/v1/properties/:id/inquiries` | **Auth:** Assigned Agent or Admin | **Success:** `200 OK`
- **Test ID:** `EP-26`

### 4.11 Update Property Inquiry Status (Nested)
- **Method:** `PATCH` | **Route:** `/api/v1/properties/:id/inquiries/:inquiryId` | **Auth:** Assigned Agent or Admin | **Success:** `200 OK`
- **Test ID:** `EP-27`

---

## 5. Standalone Inquiries Management (`/api/v1/inquiries`)

### 5.1 Submit Inquiry
- **Method:** `POST` | **Route:** `/api/v1/inquiries` | **Auth:** `CLIENT` | **Success:** `201 Created`
- **Body:** `{ "propertyId": 1, "message": "Interested in viewing this Sunday", "offerAmount": 27500000 }`
- **Test ID:** `EP-29`

### 5.2 List Inquiries
- **Method:** `GET` | **Route:** `/api/v1/inquiries` | **Auth:** Authenticated (Role-scoped) | **Success:** `200 OK`
- **Test ID:** `EP-30`

### 5.3 Get Inquiry by ID
- **Method:** `GET` | **Route:** `/api/v1/inquiries/:id` | **Auth:** Author, Assigned Agent, Admin | **Success:** `200 OK`
- **Test ID:** `EP-31`

### 5.4 Update Inquiry Status
- **Method:** `PATCH` | **Route:** `/api/v1/inquiries/:id` | **Auth:** Assigned Agent or Admin | **Success:** `200 OK`
- **Body:** `{ "status": "QUALIFIED" }`
- **Test ID:** `EP-32`

### 5.5 Delete Inquiry Record
- **Method:** `DELETE` | **Route:** `/api/v1/inquiries/:id` | **Auth:** Author or Admin | **Success:** `204 No Content`
- **Test ID:** `EP-33`

---

## 6. Tour Appointments Scheduling (`/api/v1/appointments`)

### 6.1 Book Viewing Appointment
- **Method:** `POST` | **Route:** `/api/v1/appointments` | **Auth:** `CLIENT`
- **Body:** `{ "propertyId": 1, "agentId": 2, "appointmentDate": "2026-12-01T10:00:00.000Z", "notes": "Please meet at lobby" }`
- **Success:** `201 Created` | **Test ID:** `EP-34`

### 6.2 List Appointments
- **Method:** `GET` | **Route:** `/api/v1/appointments` | **Auth:** Authenticated (Role-scoped) | **Success:** `200 OK`
- **Test ID:** `EP-35`

### 6.3 Get Appointment by ID
- **Method:** `GET` | **Route:** `/api/v1/appointments/:id` | **Auth:** Client, Assigned Agent, Admin | **Success:** `200 OK`
- **Test ID:** `EP-36`

### 6.4 Update Appointment / Remarks
- **Method:** `PATCH` | **Route:** `/api/v1/appointments/:id` | **Auth:** Client, Agent, Admin | **Success:** `200 OK`
- **Test ID:** `EP-37`

### 6.5 Cancel Appointment
- **Method:** `DELETE` | **Route:** `/api/v1/appointments/:id` | **Auth:** Client, Agent, Admin | **Success:** `204 No Content`
- **Test ID:** `EP-38`

---

## 7. Property Transactions & Settlements (`/api/v1/transactions`)

### 7.1 Record Sale Deal (Pessimistic Write Lock)
- **Method:** `POST` | **Route:** `/api/v1/transactions` | **Auth:** Admin or Assigned Agent
- **Body:**
  ```json
  {
    "propertyId": 1,
    "buyerId": 4,
    "transactionType": "SALE",
    "amount": 27500000,
    "paymentMethod": "BANK_TRANSFER",
    "notes": "Notarized Deed of Absolute Sale signed"
  }
  ```
- **Database Effect:** Acquires `pessimistic_write` lock; writes transaction row; atomically flips `properties.status` to `SOLD`.
- **Success:** `201 Created` | **Errors:** `409 Conflict` (property already sold or concurrency conflict).
- **Test ID:** `EP-39`

### 7.2 List Transactions
- **Method:** `GET` | **Route:** `/api/v1/transactions` | **Auth:** Authenticated (Role-scoped) | **Success:** `200 OK`
- **Test ID:** `EP-40`

### 7.3 Get Transaction Receipt
- **Method:** `GET` | **Route:** `/api/v1/transactions/:id` | **Auth:** Buyer, Broker, Admin | **Success:** `200 OK`
- **Test ID:** `EP-41`
