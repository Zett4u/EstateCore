# EstateCore — REST API Specification
### ITEC 116 — Systems Integration Backend Prototype

## Implemented 22 Endpoints Summary

### Authentication (3)
- `POST /api/auth/register` (Public) - Create client account
- `POST /api/auth/login` (Public) - Authenticate & obtain JWT
- `GET /api/auth/me` (Bearer JWT) - Retrieve profile

### Users (4)
- `GET /api/users` (Admin) - List all users
- `GET /api/users/:id` (Admin/Self) - Get user profile
- `PATCH /api/users/:id` (Admin/Self) - Update user profile
- `DELETE /api/users/:id` (Admin) - Deactivate user

### Properties (5)
- `POST /api/properties` (Admin/Agent) - Create listing
- `GET /api/properties` (Public) - Search & filter listings
- `GET /api/properties/:id` (Public) - Property details
- `PATCH /api/properties/:id` (Admin/Agent Owner) - Update listing
- `DELETE /api/properties/:id` (Admin/Agent Owner) - Delete listing

### Inquiries (5)
- `POST /api/inquiries` (Authenticated) - Submit inquiry
- `GET /api/inquiries` (Role-Filtered) - List inquiries
- `GET /api/inquiries/:id` (Owner/Agent/Admin) - Inquiry details
- `PATCH /api/inquiries/:id` (Role-Specific) - Update status
- `DELETE /api/inquiries/:id` (Admin/Client Owner) - Delete inquiry

### Appointments (5)
- `POST /api/appointments` (Authenticated) - Schedule viewing
- `GET /api/appointments` (Role-Filtered) - List appointments
- `GET /api/appointments/:id` (Owner/Agent/Admin) - Appointment details
- `PATCH /api/appointments/:id` (Role-Specific) - Update status/date
- `DELETE /api/appointments/:id` (Admin/Client Owner) - Cancel/delete

Total: **22 Endpoints** | Status: **100% Passed (26/26 Automated Tests)**
