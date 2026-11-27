# EstateCore Developer Guide: System Architecture

**Project:** EstateCore — Real Estate Management System  
**Academic Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student Developer:** Cabico, Cristina O. (BSIT 4-C)  

---

## 1. 3-Tier Enterprise Architecture

EstateCore is designed around a decoupled, enterprise 3-tier architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER (UI)                          │
│  React 18 Single Page Application (TypeScript + Vite + Tailwind CSS)  │
│  - Public Discovery (/properties, /agents, /about, /contact)           │
│  - Client Dashboard (/client, /appointments, /inquiries)               │
│  - Agent Workspace (/agent, /properties/new, /inquiries)               │
│  - Admin Command Center (/admin, /users, /inquiries)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (Bearer JWT Auth)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER (REST API)                        │
│  NestJS 10.4 Framework (Node.js TypeScript)                            │
│  - Global ValidationPipe (Whitelist, Transform, Type Casting)          │
│  - Global HttpExceptionFilter (Standardized Error Payloads)            │
│  - Guards: JwtAuthGuard (Passport), RolesGuard (RBAC Hierarchy)        │
│  - 7 Feature Modules: Auth, Users, Agents, Properties, Inquiries,      │
│                       Appointments, Transactions                       │
│  - Concurrency Control: TypeORM QueryBuilder with Pessimistic Locking  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TCP / Port 3307 (MySQL Protocol)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       DATA PERSISTENCE TIER                            │
│  MySQL 8.4 LTS Enterprise Database (Docker Container: estatecore-mysql)│
│  - InnoDB Storage Engine (ACID Transactions, Foreign Key Constraints)  │
│  - 7 Core Relational Tables (Users, Agents, Properties, Photos,        │
│                              Inquiries, Appointments, Transactions)    │
│  - Persistent Docker Volume: estatecore_mysql_data                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Request Lifecycle & Pipeline

Every incoming HTTP request traverses a strictly ordered series of NestJS middleware, interceptors, guards, pipes, controllers, and services:

```
HTTP Request
     │
     ▼
[Dual-Prefix Routing Middleware]
     │ (Rewrites /api/* to /api/v1/* if necessary for backward compatibility)
     ▼
[Global CORS Middleware]
     │ (Permits frontend origin and local LAN IP ranges)
     ▼
[JwtAuthGuard (Passport JWT)]
     │ (Extracts Bearer token, validates signature, verifies token is not blacklisted)
     ▼
[RolesGuard (RBAC)]
     │ (Reads @Roles() metadata, compares request user role with required hierarchy)
     ▼
[Global ValidationPipe]
     │ (Validates request body against DTO class-validator decorators, strips non-whitelisted keys)
     ▼
[Controller Route Handler]
     │ (Extracts typed parameters, calls appropriate service method)
     ▼
[Service Domain Logic]
     │ (Executes business rules, ownership checks, transaction boundaries)
     ▼
[TypeORM Repository / EntityManager]
     │ (Executes parameterized SQL queries against MySQL database)
     ▼
[Global HttpExceptionFilter]
     │ (Intercepts uncaught errors, formats response into uniform JSON schema)
     ▼
HTTP Response
```

---

## 3. Concurrency Locking & Double-Sale Prevention

A critical enterprise requirement in real estate platforms is ensuring that two agents cannot simultaneously record sales transactions for the same property. EstateCore implements database-level pessimistic write locking in `backend/src/transactions/transactions.service.ts`:

```typescript
// Controlled Atomic Deal Recording
await this.dataSource.transaction(async (manager) => {
  // 1. Acquire exclusive pessimistic write lock on the property record
  const property = await manager
    .getRepository(Property)
    .createQueryBuilder('property')
    .setLock('pessimistic_write')
    .where('property.id = :id', { id: dto.propertyId })
    .getOne();

  if (!property) {
    throw new NotFoundException(`Property with ID ${dto.propertyId} not found.`);
  }

  // 2. Verify listing availability
  if (property.status === PropertyStatus.SOLD || property.status === PropertyStatus.RESERVED) {
    throw new ConflictException('Property is no longer available for transaction.');
  }

  // 3. Insert audited transaction record
  const transaction = manager.create(PropertyTransaction, {
    propertyId: dto.propertyId,
    buyerId: dto.buyerId,
    agentId: agent.id,
    transactionType: dto.transactionType,
    amount: dto.amount,
    paymentMethod: dto.paymentMethod,
    status: TransactionStatus.PENDING,
    notes: dto.notes,
  });
  const savedTx = await manager.save(transaction);

  // 4. Atomically transition property status to SOLD
  property.status = PropertyStatus.SOLD;
  await manager.save(property);

  return savedTx;
});
```

### Why Pessimistic Locking?
- **Pessimistic Write Lock (`SELECT ... FOR UPDATE`):** Blocks concurrent transaction workers from reading or modifying the property until the current transaction commits or rolls back.
- If two requests arrive concurrently (e.g. within 5 milliseconds):
  - Request A acquires the lock, validates that status is `AVAILABLE`, writes the transaction, and sets status to `SOLD`.
  - Request B is suspended at the database level until Request A commits. Once resumed, Request B reads the updated status (`SOLD`) and immediately aborts with `409 ConflictException`.
- Verified in automated test suite `scripts/test_phase5_1_stabilization.js` (Section 5).

---

## 4. Dual-Prefix Routing Architecture

To satisfy both legacy client applications calling `/api/*` and modern academic specifications requiring `/api/v1/*` (Lab 05), `backend/src/main.ts` configures an automatic Express middleware alias:

```typescript
// 1. Set canonical global prefix to /api/v1
app.setGlobalPrefix('api/v1');

// 2. Transparent backward-compatibility rewrite for legacy /api/* routes
app.use((req, res, next) => {
  if (req.url.startsWith('/api/') && !req.url.startsWith('/api/v1/')) {
    req.url = req.url.replace('/api/', '/api/v1/');
  }
  next();
});
```

- Any request to `/api/properties` is transparently routed to `/api/v1/properties`.
- Responses preserve the identical format and headers, ensuring zero frontend breaking changes.
