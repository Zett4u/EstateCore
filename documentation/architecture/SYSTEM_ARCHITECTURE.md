# EstateCore — System Architecture Document
### ITEC 116 — Systems Integration Backend Prototype

## 1. High-Level Architectural Model
EstateCore follows a clean, decoupled 3-tier client-server architecture:
- **Presentation Tier:** React 18, Vite, and Tailwind CSS. Communicates via RESTful JSON over HTTP with JWT authentication headers.
- **Application Logic Tier:** NestJS 10 running on Node.js and TypeScript. Encapsulates business logic, guards, validation pipes, and TypeORM data mappers.
- **Data Persistence Tier:** MySQL 8.4 LTS encapsulated in Docker container `estatecore-mysql` with persistent volume `estatecore_mysql_data`.

## 2. Layered Component Responsibilities
- **Controllers:** Handle incoming HTTP requests, enforce route guards (`JwtAuthGuard`, `RolesGuard`), invoke validation pipes, and return semantic HTTP responses.
- **Services:** Contain business rules, including ownership checks, password hashing, JWT signing, and conflict prevention.
- **Repositories & Entities:** Map TypeScript class definitions to relational tables, enforce foreign keys and indices, and execute ACID-compliant queries.
- **Docker Compose:** Ensures persistent, isolated, and identical MySQL environments across development, testing, and grading evaluation.

## 3. Data Flow Tracing
$$\text{Client (Postman/React)} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{MySQL Database}$$
$$\text{Client (Postman/React)} \longleftarrow \text{Controller} \longleftarrow \text{Service} \longleftarrow \text{Repository} \longleftarrow \text{MySQL Database}$$
