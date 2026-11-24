# EstateCore — Frontend Design System & UI Architecture

## 1. Design Direction & Aesthetic Philosophy

EstateCore’s user interface was completely redesigned to emulate premier architectural and real-estate SaaS platforms (specifically drawing inspiration from **Haven Estate** on Framer Marketplace and **Kredium**). 

The platform departs from generic AI dashboards by utilizing:
- **Warm Architectural Neutrals:** Subtle stone canvas (`#FAF9F6`, `stone-50`), soft container borders (`stone-200/90`), and deep charcoal text (`stone-900`).
- **Restrained Forest Accents:** Deep botanical emerald/forest tones (`forest-700` `#1B4332`, `forest-800` `#143628`) used exclusively for intentional calls to action, badges, and brand highlights.
- **Editorial Typography Pairing:**
  - **Headings & Display:** `Playfair Display` serif font for luxury prestige, hero headlines, and property showcase titles.
  - **Body, Inputs & Specs:** `Plus Jakarta Sans` geometric sans-serif for legibility, tabular property metrics, and dense management tables.
- **Architectural Photography Standards:** Curated fallback imagery for Condominiums, Modern Villas, Townhouses, Luxury Apartments, and Commercial Offices.
- **Physical Elevation & Micro-Interactions:** Custom subtle shadows (`shadow-subtle`, `shadow-card`), border transitions, and smooth hover zooms.

---

## 2. Design Tokens & Palette

### Color Palette

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `stone-50` | `#FAF9F6` | Primary background canvas |
| `stone-100` | `#F5F4F0` | Input fields, subtle cards, specification pills |
| `stone-200` | `#E7E5DF` | Card borders, dividers, subtle outlines |
| `stone-700` | `#44403C` | Secondary body text, table metadata |
| `stone-900` | `#1C1917` | Primary high-contrast headlines |
| `forest-50` | `#F0FDF4` | Badge backgrounds, active selection pills |
| `forest-100` | `#DCFCE7` | Feature highlight chips |
| `forest-700` | `#1B4332` | Primary brand CTA buttons, brand badges |
| `forest-800` | `#143628` | Hover state for primary buttons |
| `gold-500` | `#C99700` | Luxury accolades, star ratings |

### Typography Scale

- `font-serif`: `'Playfair Display', Georgia, serif`
- `font-sans`: `'Plus Jakarta Sans', system-ui, sans-serif`
- Tracking: `tracking-tight` for large display headings, `tracking-wider` and `tracking-widest` for uppercase metric labels.

---

## 3. Separation of Concerns & Route Architecture

EstateCore strictly separates public-facing property marketing from authenticated business operations:

### Public Website Routes (`PublicLayout.tsx`)
- `/`: **Landing Page** with architectural hero section, quick tabbed filter bar, live metrics counter, curated listings showcase, "How It Works" 3-step walkthrough, and dual call-to-action banner.
- `/properties`: **Public Property Catalog** with real-time keyword search, classification filters (Condominium, Villa, Townhouse, Commercial, Land), transaction toggle (Sale/Rent), and responsive card grid.
- `/properties/:id`: **Property Detail Dossier** featuring full-bleed visual banner, specifications grid (beds, baths, floor area, lot area), narrative overview, amenities checklist, assigned agent bio card, inquiry submission modal, and viewing tour reservation modal.
- `/about`: **Brand & Architecture Philosophy** highlighting regulatory compliance, licensed brokerage standards, and academic attribution.
- `/contact`: **Headquarters & Client Inquiries** with office directory, interactive contact form, and direct branch communication channels.

### Authentication Screens (`Login.tsx`, `Register.tsx`)
- Standalone luxury layouts with warm stone backdrop.
- **Demo Autofill Chips:** 1-click credentials for `Admin`, `Agent`, and `Client` seeded accounts (`Password123!`).
- Smooth form validation, error banners, and direct redirection to role-specific workspaces.

### Authenticated Business Shell (`DashboardLayout.tsx`)
- `Navbar.tsx`: Minimalist top header displaying current user identity, role badge, profile settings link, and one-click link back to public catalog.
- `Sidebar.tsx`: Charcoal dark navigation (`#14171A`) with role-based link filtering and live backend status indicator.
- `/admin`: **Executive Administrator Dashboard** with KPI counters, recent inquiries queue, viewing tour schedules, and user management shortcuts.
- `/agent`: **Real Estate Advisor Workspace** featuring assigned property count, client leads, and upcoming tours.
- `/client`: **Client Portal** with inquiries tracker, tour calendar, and quick-save property recommendations.
- `/properties/new` & `/properties/:id/edit`: **Property Form Editor** with structured sections for Title, Classification, Dimensions, Location, and Agent Assignment.
- `/inquiries`: **Inquiries Center** with status changer (`PENDING`, `CONTACTED`, `QUALIFIED`, `CLOSED`) and delete actions.
- `/appointments`: **Viewing Tours Coordination** with date/time slots, conflict-safe status updates (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- `/users`: **User Access Management** (Admin Only) with role selector and safe account deactivation toggles.
- `/profile`: **User Security & Credentials** for changing display names and passwords.

---

## 4. Reusable UI Component Library

All reusable UI components are encapsulated under `frontend/src/components/ui/`:
1. `Button.tsx`: Supports variants `primary`, `secondary`, `outline`, `ghost`, `danger`, with loading spinner states.
2. `Badge.tsx`: Pill indicators with semantic variants (`forest`, `amber`, `blue`, `stone`, `danger`).
3. `Card.tsx`: Card surfaces with consistent borders and responsive padding.
4. `Modal.tsx`: Accessible dialog with backdrop blur, keyboard ESC dismissal, and header actions.
5. `PublicNavbar.tsx` & `PublicFooter.tsx`: Public marketing navigation and brand footer.
6. `StatCard.tsx`: Quantitative metric card with icon container and subtext.
7. `StatusBadge.tsx`: Color-coded status chip mapping domain states (AVAILABLE, RESERVED, SOLD, PENDING, CONFIRMED, etc.).
