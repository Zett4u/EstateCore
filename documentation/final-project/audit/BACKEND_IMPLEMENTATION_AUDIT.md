# EstateCore Final Audit: Backend Implementation & Architecture Audit

**Project:** EstateCore — Real Estate Management System  
**Audit Milestone:** Final Project Verification & Academic Submission Audit  
**Auditor:** Independent Technical Auditor & Academic Reviewer  
**Audit Date:** November 26, 2026  
**Framework:** NestJS 10.x + TypeORM 0.3.x + TypeScript 5.x  
**Runtime:** Node.js v24.18.1  
**Build Verification:** `npm run build` -> Clean exit (code 0)  

---

## 1. Executive Summary

This backend implementation audit conducts a line-by-line inspection of the NestJS modular codebase under `backend/src/`. The audit verifies adherence to clean architecture principles, dependency injection patterns, relational entity mapping, data transfer object (DTO) validation pipelines, exception handling, and transaction safety.

The audit confirms:
1. **Zero Mocked Responses:** Every single endpoint executes live queries against TypeORM repositories or transactional entity managers.
2. **Modular Architecture:** 7 business feature modules (`Auth`, `Users`, `Agents`, `Properties`, `Inquiries`, `Appointments`, `Transactions`) organized around domain entities.
3. **Concurrency Control:** Critical property settlement flows utilize pessimistic write locks (`pessimistic_write`) to prevent double-selling.
4. **Input Sanitization:** DTOs strictly enforce type safety, regex patterns, and range validation via `class-validator` and `class-transformer`.

---

## 2. Module Inventory & Dependency Graph

```
AppModule
 ├── ConfigModule (Loads .env configurations)
 ├── TypeOrmModule (Establishes MySQL connection with entities)
 ├── PassportModule (JWT authentication strategy)
 ├── JwtModule (Token signing & verification)
 ├── CommonModule (Global filters, guards, pipes, token blacklist)
 ├── AuthModule
 ├── UsersModule
 ├── AgentsModule
 ├── PropertiesModule
 ├── InquiriesModule
 ├── AppointmentsModule
 └── TransactionsModule
```

### 2.1 Module Component Verification

| Module Name | Controller | Service | Injected Repositories / Services |
| :--- | :--- | :--- | :--- |
| `AuthModule` | `AuthController` | `AuthService`, `TokenBlacklistService` | `UsersService`, `JwtService`, `AgentsRepository` |
| `UsersModule` | `UsersController` | `UsersService` | `Repository<User>` |
| `AgentsModule` | `AgentsController` | `AgentsService` | `Repository<Agent>`, `Repository<User>` |
| `PropertiesModule` | `PropertiesController` | `PropertiesService` | `Repository<Property>`, `Repository<PropertyPhoto>`, `Repository<Inquiry>`, `Repository<Agent>` |
| `InquiriesModule` | `InquiriesController` | `InquiriesService` | `Repository<Inquiry>`, `Repository<Property>`, `Repository<User>` |
| `AppointmentsModule` | `AppointmentsController` | `AppointmentsService` | `Repository<Appointment>`, `Repository<Property>`, `Repository<User>` |
| `TransactionsModule` | `TransactionsController` | `TransactionsService` | `Repository<PropertyTransaction>`, `Repository<Property>`, `Repository<User>`, `Repository<Agent>`, `DataSource` |

---

## 3. Deep Dive: Key Services & Implementation Patterns

### 3.1 Transactions Service: Concurrency & Atomicity
`backend/src/transactions/transactions.service.ts`:
- **Transactional Boundary:** Wraps deal recording in `this.dataSource.transaction(async (manager) => { ... })`.
- **Pessimistic Locking:** Executes `manager.getRepository(Property).createQueryBuilder('property').setLock('pessimistic_write').where('property.id = :id', { id: dto.propertyId }).getOne()`.
- **Race Condition Prevention:** If the property status is already `SOLD` or `RESERVED`, the transaction aborts with `ConflictException('Property is no longer available for transaction')`.
- **Atomic State Mutation:** Upon inserting the audited `PropertyTransaction` record, the property status is atomically flipped to `SOLD`.

### 3.2 Properties Service: Ownership & Agent Resolution
`backend/src/properties/properties.service.ts`:
- **Agent Resolution:** Correctly isolates `agents.id` from `users.id`. When an agent submits a listing, the service queries `this.agentsRepo.findOne({ where: { userId: user.id } })` to set `property.agentId = agent.id`.
- **Owner Resolution:** When a client submits a listing, `property.ownerId = user.id` is attributed, keeping `agentId = null` until an agent is assigned.
- **BOLA Protection:** Updates and deletions verify `if (user.role === 'AGENT' && property.agentId !== agent.id) throw new ForbiddenException(...)` and `if (user.role === 'CLIENT' && property.ownerId !== user.id) throw new ForbiddenException(...)`.
- **Relational Integrity Protection:** Prevents deletion of properties that possess active transaction settlements with `ConflictException`.

### 3.3 Auth & Token Revocation Service
`backend/src/auth/auth.service.ts` & `backend/src/common/services/token-blacklist.service.ts`:
- **Password Security:** Hashes passwords with `bcrypt.hash(password, 10)` during registration and validates with `bcrypt.compare`.
- **Agent Claim Issuance:** For users with role `AGENT`, resolves their corresponding `agentId` from `agents` table and embeds `agentId` in the signed JWT payload (Lab 06 Page 22).
- **Server-Side Token Revocation:** `TokenBlacklistService` tracks logged-out token identifiers (`jti` or hash) with timestamp-based automatic expiration cleanup.
- **Guard Enforcement:** `JwtAuthGuard` checks `tokenBlacklistService.isBlacklisted(token)` on every authenticated request, returning `401 Unauthorized` if revoked.

---

## 4. Input Validation & Error Handling

### 4.1 Global Validation Pipeline
In `backend/src/main.ts`:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```
- Unknown properties in payloads are strictly rejected.
- String query parameters are automatically cast to typed numbers.

### 4.2 Global HTTP Exception Filter
`backend/src/common/filters/http-exception.filter.ts`:
Formats all errors into an academic standardized JSON payload:
```json
{
  "statusCode": 400,
  "timestamp": "2026-11-26T03:48:08.830Z",
  "path": "/api/v1/properties",
  "method": "POST",
  "error": "Bad Request",
  "message": [
    "Listing type must be SALE or RENT."
  ]
}
```

---

## 5. Audit Findings

| Audit Check | Requirement | Result | Evidence |
| :--- | :--- | :--- | :--- |
| Mock/Stub Code | Zero mocks in controllers | **PASSED** | All 7 controllers inject real TypeORM services |
| Modular Structure | $\ge 3$ domain modules | **PASSED** | 7 domain modules implemented |
| DTO Schema Enforcement | All endpoints validate bodies | **PASSED** | DTOs present for all POST/PUT/PATCH routes |
| Concurrency Defense | Prevent double-sale race condition | **PASSED** | `setLock('pessimistic_write')` verified in test |
| Type Safety | Clean TypeScript build | **PASSED** | `nest build` completes with 0 errors |
