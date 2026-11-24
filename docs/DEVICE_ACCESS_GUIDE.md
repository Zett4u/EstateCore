# EstateCore — Multi-Device & Cross-Network Access Guide
### How to Access and Test EstateCore from Phones, Tablets, and Other Computers

This guide explains step-by-step how to access the live EstateCore system from any secondary device (iPhone, Android smartphone, iPad/tablet, or another laptop) connected to the same local network, as well as how to deploy and run it on a new computer.

---

## Part 1: Quick Access from a Phone, Tablet, or Another Laptop (Same Wi-Fi)

You do **not** need to install Docker, Node.js, or Git on your phone or secondary devices. As long as the host computer is running EstateCore, any device on the same Wi-Fi can access the full application.

### Step 1: Confirm the Host Computer Services are Running
On the main computer hosting the application, make sure these three services are active:
1. **MySQL 8.4 Container:**
   ```bash
   docker compose ps
   # Should show estatecore-mysql running on port 3307:3306
   ```
2. **NestJS Backend:**
   ```bash
   cd backend
   node dist/main.js
   # Or: npm run start:dev
   # Running on http://0.0.0.0:3000/api
   ```
3. **Vite Frontend Dev Server:**
   ```bash
   cd frontend
   npm run dev
   # Vite is configured with `host: true` and a reverse proxy for `/api`
   ```

---

### Step 2: Find Your Host Machine's Local IP Address

#### On Windows:
1. Open PowerShell or Command Prompt.
2. Run:
   ```powershell
   ipconfig
   ```
3. Look for your active adapter (typically **Wireless LAN adapter Wi-Fi** or **Ethernet adapter**).
4. Note the **IPv4 Address** (for example: `192.168.254.105`).

#### On macOS:
1. Open Terminal.
2. Run:
   ```bash
   ipconfig getifaddr en0
   ```
   *(Or check System Settings → Network → Wi-Fi → Details).*

#### On Linux:
1. Open Terminal.
2. Run:
   ```bash
   hostname -I | awk '{print $1}'
   ```

---

### Step 3: Connect and Open from Your Mobile Device or Laptop

1. **Connect to the same Wi-Fi network** as the host computer.
2. Open your mobile browser (**Safari**, **Google Chrome**, **Firefox**, or **Samsung Internet**).
3. In the URL address bar, enter:
   ```text
   http://<YOUR_HOST_IP>:5173
   ```
   *Real Example:*
   ```text
   http://192.168.254.105:5173
   ```

---

### Step 4: How Authentication & APIs Work on Mobile

You can immediately use all features on your mobile device:
- **Browse Properties**: Filter by category, price, and for sale / for rent.
- **1-Click Test Logins**: On the `/login` page, tap **"Client"**, **"Agent"**, or **"Admin"** to instantly test each role.
- **Book Property Tours**: Select a date and time to schedule viewing appointments.
- **Cancel Appointments**: Easily cancel viewing appointments from the client dashboard.
- **Submit Inquiries**: Send direct questions to licensed agents.

> [!NOTE]
> **Why this works seamlessly:** The Vite dev server includes a reverse proxy. When your phone requests `/api/properties`, the phone communicates with `http://192.168.254.105:5173/api`, and the host computer internally proxies the request to the NestJS backend at `http://localhost:3000/api`. This eliminates cross-origin (CORS) blocks and IP configuration hassles!

---

### Step 5: Troubleshooting Mobile Connection Issues

#### Issue 1: Page fails to load or times out
- **Cause:** Windows Defender Firewall is blocking inbound connections on port 5173.
- **Solution:** Open PowerShell as **Administrator** on the host machine and run:
  ```powershell
  New-NetFirewallRule -DisplayName "EstateCore Web (5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
  ```

#### Issue 2: "Device cannot reach host IP"
- **Cause:** The mobile device is connected to mobile data (4G/5G) or a different Wi-Fi network (or router "Guest Mode" / AP isolation is enabled).
- **Solution:** Verify that both the phone and computer are connected to the exact same Wi-Fi SSID. If on a university or public Wi-Fi that isolates clients, create a **Mobile Hotspot** from your phone or laptop and connect both devices to that hotspot.

---

## Part 2: Installing and Running from Scratch on Another Computer

If you want to set up and run EstateCore entirely on another computer (e.g. for defense presentation or grading):

### Prerequisites
1. **Node.js** (v18.x or v20.x LTS) &ndash; [nodejs.org](https://nodejs.org/)
2. **Git** &ndash; [git-scm.com](https://git-scm.com/)
3. **Docker Desktop** &ndash; [docker.com](https://www.docker.com/products/docker-desktop/) (must be running)

### Step-by-Step Terminal Commands

#### 1. Clone the Project
```bash
git clone https://github.com/Zett4u/EstateCore.git
cd EstateCore
```

#### 2. Copy the Environment Configuration (.env)
The repository provides ready-to-run `.env.example` templates with all matching database ports and credentials:
```bash
# On Linux / macOS / Git Bash:
cp .env.example .env
cp backend/.env.example backend/.env

# On Windows PowerShell:
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

#### 3. Start MySQL via Docker
```bash
docker compose up -d
```
Check that the database container is running:
```bash
docker compose ps
```

#### 4. Setup Backend
```bash
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```
*(Leave this terminal window open. Backend is running at `http://localhost:3000/api`)*

#### 4. Setup Frontend
Open a **new** terminal window:
```bash
cd EstateCore/frontend
npm install
npm run dev
```
*(Frontend is now accessible at `http://localhost:5173` locally, and at `http://<IP>:5173` over the network).*

---

## Part 3: Test Accounts Summary

| Role | Username / Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@estatecore.local` | `Password123!` | System KPI charts, User management, Create listings, Inquiries overview |
| **Agent** | `maria.santos@estatecore.local` | `Password123!` | Assigned properties, Follow-up on inquiries, Check viewing tours |
| **Client** | `juan.delacruz@client.local` | `Password123!` | Browse catalog, Submit inquiries, Book/cancel tour appointments |

Enjoy testing and presenting EstateCore!
