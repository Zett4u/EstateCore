# EstateCore Developer Guide: Troubleshooting Guide

**Project:** EstateCore — Real Estate Management System  
**Audience:** Developers, Evaluators, and DevOps Maintainers  

---

## 1. Database Connection & Port Issues

### Issue 1: Docker Port 3307 is Already in Use
- **Symptom:** `Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3307 -> 0.0.0.0:0: listen tcp 0.0.0.0:3307: bind: address already in use`
- **Cause:** Another local service (or a previous Docker container instance) is bound to host port 3307.
- **Solution:**
  1. Inspect processes using port 3307:
     ```powershell
     Get-NetTCPConnection -LocalPort 3307
     ```
  2. If an old container is running, stop it:
     ```bash
     docker compose down
     docker compose up -d
     ```
  3. Or adjust the port mapping in `docker-compose.yml` (e.g. `3308:3306`) and update `DB_PORT=3308` in `backend/.env`.

---

### Issue 2: "Table doesn't exist" (e.g. `Table 'estatecore_db.agents' doesn't exist`)
- **Symptom:** Backend returns `500 Internal Server Error: Table 'estatecore_db.agents' doesn't exist`.
- **Cause:** 
  - On a fresh clone, the database `estatecore_db` has not had migrations applied or seed data imported yet.
  - Or, if testing on the author's local environment, `backend/.env` is set to `estatecore_db` instead of the pre-migrated sandbox `estatecore_test_restore`.
- **Solution:**
  - For a new installation:
    ```bash
    cd backend
    npm run migration:run
    npm run seed
    ```
    Or import the verified SQL dump:
    ```bash
    docker exec -i estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db < documentation/deliverables/EstateCore_Final_Project.sql
    ```
  - For author's local sandbox: Set `DB_NAME=estatecore_test_restore` in `backend/.env`.

---

## 2. Authentication & Session Issues

### Issue 3: Received `401 Unauthorized` on Valid Protected Route
- **Symptom:** API requests return `401 Unauthorized: Unauthorized`.
- **Cause:** 
  1. The JWT token has expired. In accordance with academic requirement `estatecire.pdf` Lab 06 (p. 20), JWT tokens strictly expire after **1 hour (3600 seconds)**.
  2. Or the token was revoked via `POST /api/v1/auth/logout` (server-side token blacklist).
- **Solution:** Re-authenticate by logging in again via `POST /api/v1/auth/login` or using the 1-click login buttons on the frontend.

---

### Issue 4: Received `429 Too Many Requests` Lockout
- **Symptom:** `429 Too Many Requests: Too many failed login attempts. Please try again later.`
- **Cause:** Lab 06 (p. 21) brute-force rate limiting triggered after 5 consecutive incorrect passwords.
- **Solution:** Wait 15 minutes for the sliding window to reset, or restart the backend process to clear the in-memory rate-limiter cache.

---

## 3. Windows PowerShell Execution & Tooling Issues

### Issue 5: PowerShell Script Execution Policy Error (`npm.ps1 cannot be loaded`)
- **Symptom:** `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Cause:** Windows PowerShell default `ExecutionPolicy` is set to `Restricted`.
- **Solution:**
  - Use `npm.cmd` explicitly in PowerShell:
    ```powershell
    npm.cmd run build
    npm.cmd run start:dev
    ```
  - Or set execution policy for current process:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```

---

## 4. Network & Mobile Device Connection Issues

### Issue 6: Other Devices on Local Wi-Fi Cannot Connect to `http://<HOST_IP>:5173`
- **Symptom:** Mobile browser shows `ERR_CONNECTION_TIMED_OUT` or `Cannot connect to server`.
- **Cause:** Windows Defender Firewall is blocking inbound connections to port 5173.
- **Solution:** Open PowerShell as Administrator on the host machine and run:
  ```powershell
  New-NetFirewallRule -DisplayName "EstateCore Web (5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
  ```
- Also ensure both devices are connected to the same private Wi-Fi network and that the router does not have "AP Isolation" or "Guest Mode" enabled.
