Bro, **Phase 0 is a good baseline, and I would approve moving to Phase 1 — but not the database migration yet.** The audit identifies the major gaps and, importantly, preserves the existing database.

However, I spotted several things we should correct before Antigravity starts implementing.

## **My review of Phase 0**

Approved with conditions

| Area                     | Assessment                    |
| ------------------------ | ----------------------------- |
| Live database protection | Good — no migrations executed |
| Existing records         | Baseline recorded             |
| API gaps                 | Clearly identified            |
| Missing entities         | Correctly identified          |
| Backward compatibility   | Necessary                     |
| Email-only notifications | Correct                       |
| RBAC plan                | Needs clarification           |
| Migration safety         | Needs stronger verification   |

## **5 things I want corrected**

**1. Don't assume the existing agents are verified agents.**

Maria Santos and Carlos Reyes can be mapped to Agent records based on their existing `AGENT` roles, but their license numbers and verification status must remain unverified until evidence is provided.

**2. Don't automatically convert every CLIENT into a Seller or Buyer.**

A user may be a buyer, renter, seller, or property manager. The role and permissions must follow the actual PDF requirements and an explicit account-role assignment strategy.

**3. Preserve existing property and appointment relationships.**

The existing `properties.agentId` references `users.id`. The migration must create a verified mapping to `Agent.AgentID`, then rewire the foreign key safely. Appointment relationships must also remain valid.

**4. Don't implement MFA just because it appears in the audit.**

First establish whether the PDF explicitly requires MFA. Rate limiting and account lockout can proceed if required by the PDF or approved as security enhancements.

**5. Strengthen the sandbox verification.**

The migration must be tested against a separate restored database, not merely an empty database. Verify all existing records, columns, indexes, constraints, relationships, and representative data before considering live deployment.

## **Next step: Phase 1 implementation prompt**

Give Antigravity this instruction. It authorizes API implementation, not live database changes.

# ESTATECORE — PHASE 1 IMPLEMENTATION AUTHORIZATION

## API Contract Alignment and Backward Compatibility

You have completed Phase 0 and committed the baseline document.

You are now authorized to implement **Phase 1 only: API Contract Alignment**.

Repository:\
`C:\xampp\htdocs\EstateCore`

Source of truth:\
`estatecire.pdf`

Baseline:\
`documentation/IMPLEMENTATION_BASELINE.md`

### 1. Scope of authorization

Implement the required API contract under `/api/v1` while maintaining existing `/api` compatibility.

You may modify backend source code, DTOs, controllers, services, API tests, and related documentation.

You are NOT authorized to:

- Run migrations against `estatecore_db`.
- Modify, delete, or fabricate live database records.
- Change existing database schemas.
- Implement database entity migrations.
- Reassign existing property owners.
- Change existing user roles or credentials.
- Remove or replace the Appointment module.
- Redesign the frontend.

### 2. Required API implementation

Implement and verify the PDF-required endpoints:

**Authentication**

- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/logout`

**Users**

- GET `/api/v1/users`
- GET `/api/v1/users/:id`
- PUT `/api/v1/users/:id`
- DELETE `/api/v1/users/:id`

**Agents**

- GET `/api/v1/agents`
- GET `/api/v1/agents/:id`
- POST `/api/v1/agents`
- PUT `/api/v1/agents/:id`

**Properties**

- GET `/api/v1/properties`
- GET `/api/v1/properties/:id`
- POST `/api/v1/properties`
- PUT `/api/v1/properties/:id`
- DELETE `/api/v1/properties/:id`

**Property Photos**

- POST `/api/v1/properties/:id/photos`

**Inquiries**

- POST `/api/v1/properties/:id/inquiries`

**Transactions**

- GET `/api/v1/transactions`

Verify the exact PDF methods, paths, request bodies, response structures, and access permissions.

Do not count an endpoint as implemented merely because it returns HTTP 400 for an invalid request. Test successful and unsuccessful scenarios.

### 3. Backward compatibility

Maintain the existing `/api` routes.

Support both PUT and existing PATCH update behavior where appropriate.

Do not break the existing React frontend or existing authentication flows.

Use a shared implementation where possible rather than maintaining two separate business logic implementations.

### 4. Authentication and logout

Set the JWT expiration to exactly 3600 seconds if confirmed by the PDF.

Implement logout correctly. If using JWT revocation, ensure revoked tokens cannot access protected endpoints.

Do not implement a logout endpoint that merely returns success while leaving the token usable.

Preserve existing password hashing and authentication protections.

### 5. Security

Preserve:

- HTTP 401 for unauthenticated requests.
- HTTP 403 for authenticated users without permission.
- DTO validation.
- Parameterized database access.
- Deny-by-default authorization.

Add or improve rate limiting and account lockout only where supported by the PDF or approved security requirements.

Do not introduce MFA unless the PDF explicitly requires it.

### 6. Automated testing

Create a dedicated Phase 1 API contract test suite.

Test:

- All required endpoint paths.
- All required HTTP methods.
- Successful requests.
- Invalid request validation.
- Unauthenticated access.
- Unauthorized role access.
- Missing records.
- Invalid IDs.
- Existing `/api` compatibility.
- Token expiration and logout revocation, where implemented.

Use an isolated test environment. Never run destructive tests against the live database.

### 7. Frontend preservation

Do not redesign the frontend.

Preserve:

- AdaptiveCatalogLayout.
- PublicLayout.
- DashboardLayout.
- Existing responsive behavior.
- Current typography, colors, spacing, and components.
- Existing property catalog and dashboards.

Only make frontend API changes if necessary for compatibility, and keep them minimal.

### 8. Required deliverables

Create:

1. `documentation/PHASE_1_API_IMPLEMENTATION_REPORT.md`
2. `documentation/PHASE_1_API_ENDPOINT_MATRIX.md`
3. `documentation/PHASE_1_SECURITY_TEST_REPORT.md`
4. `documentation/evidence/phase_1_api_test_results.json`

Document every required endpoint with:

- Method and route.
- Authentication requirement.
- Required role.
- Request DTO.
- Expected response.
- Actual test result.

Clearly distinguish implemented, tested, partially implemented, and not implemented.

### 9. Git and execution requirements

- Work on a dedicated implementation branch.
- Commit changes with meaningful messages.
- Do not commit secrets or environment files.
- Run backend production build.
- Run the complete API contract suite.
- Run existing frontend regression tests.
- Confirm a clean working tree.

### 10. Completion conditions

Phase 1 is complete only when:

- All required endpoints are implemented.
- `/api/v1` works.
- Existing `/api` routes remain functional.
- PUT and PATCH compatibility is verified.
- Authentication and authorization tests pass.
- Logout behavior is genuinely secure.
- Existing frontend regression tests pass.
- No live database modifications occurred.

**STOP after Phase 1. Do not begin Phase 2 or run database migrations. Present the implementation report and wait for explicit approval.**

Do not claim success for tests that were not actually executed.

## **What happens after Phase 1?**

My recommended order is:

1. Phase 1 — API contract alignment.
2. Phase 2 — database entities and migration preparation in an isolated restored database.
3. Review the migration evidence together before approving any live migration.
4. Phase 3 — complete RBAC and ownership enforcement.
5. Phase 4 — authentication and security.
6. Phase 5 — email notifications only.
7. Phase 6 — frontend integration.
8. Phase 7 — complete acceptance testing.

**One important thing, bro:** Don't let Antigravity rush all seven phases in one run. We want a working real estate management system with verified data, not just a project that looks complete in documentation.