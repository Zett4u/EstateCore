# EstateCore Developer Guide: Frontend Developer Guide

**Project:** EstateCore — Real Estate Management System  
**Framework:** React 18 + Vite + TypeScript + Tailwind CSS  
**Routing:** React Router DOM v6  
**Icons:** Lucide React  

---

## 1. Frontend Architecture & Folder Structure

The frontend application resides under `frontend/` and follows a structured component-based layout:

```
frontend/src/
 ├── components/         # Reusable presentation and layout components
 │    ├── public/        # Public navbar, footer, search hero, property cards
 │    ├── shared/        # Modals, confirmation dialogs, status badges
 │    └── Sidebar.tsx    # Authenticated dashboard sidebar navigation
 ├── context/            # Global state providers
 │    └── AuthContext.tsx# Authentication state, login/logout, JWT decoding
 ├── pages/              # Routed screen views
 │    ├── AgentsList.tsx       # Public advisor directory
 │    ├── AppointmentsList.tsx # Tour booking calendar & status management
 │    ├── InquiriesList.tsx    # Prospect inquiries and offer review
 │    ├── Login.tsx            # Login screen with 1-click demo buttons
 │    ├── PropertiesList.tsx   # Public property search catalog
 │    ├── PropertyDetail.tsx   # Property specifications, photos, offer forms
 │    ├── PropertyForm.tsx     # Listing publication and editing
 │    ├── Register.tsx         # Client account registration
 │    ├── TransactionsList.tsx # Settled deals & financial audit log
 │    └── UsersList.tsx        # Administrative user account governance
 ├── services/           # Backend communication layer
 │    └── api.ts         # Axios/Fetch client with interceptors & typed endpoints
 ├── types/              # Domain interfaces and enums matching backend entities
 │    └── index.ts       # User, Agent, Property, Inquiry, Transaction types
 ├── App.tsx             # Root component, router definitions, protected routes
 └── main.tsx            # Application bootstrapping & CSS imports
```

---

## 2. Authentication Context & State Management

Global session state is managed via `AuthContext.tsx`:
- **Token Storage:** JWT token is stored securely in `localStorage` under `token`.
- **Role Hydration:** Decodes user ID, email, global role (`ADMIN`, `AGENT`, `CLIENT`), and `agentId` (for Agents).
- **1-Click Demo Buttons:** On `Login.tsx`, convenience buttons instantly populate pre-seeded credentials for `ADMIN` (`admin@estatecore.local`), `AGENT` (`maria.santos@estatecore.local`), and `CLIENT` (`juan.delacruz@client.local`) for defense demonstration.
- **Automatic Logout:** If any API request returns `401 Unauthorized`, `api.ts` intercepts the response, clears the session, and redirects to `/login`.

---

## 3. Role-Based Route Guards

Routes in `App.tsx` are wrapped in role-aware protection components:

```tsx
// Protected Route Pattern
<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <UsersList />
    </ProtectedRoute>
  }
/>
```

- Unauthenticated users attempting to access private routes are redirected to `/login`.
- Authenticated users with insufficient privileges (e.g. a `CLIENT` navigating to `/admin/users`) are redirected to an unauthorized warning page with `403 Forbidden` status.

---

## 4. Vite Reverse Proxy Configuration for Mobile LAN Access

To enable zero-configuration mobile access across smartphones, tablets, and laptops on the same local network, `frontend/vite.config.ts` includes an automatic reverse proxy:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Why This Matters:
- When someone visits `http://192.168.1.100:5173` on a smartphone, browser requests to `/api/v1/properties` are made relatively to port 5173.
- The Vite development server forwards these calls internally to `http://localhost:3000`, completely bypassing browser Cross-Origin Resource Sharing (CORS) blocks and eliminating the need to hardcode the host IP address in frontend build files.
