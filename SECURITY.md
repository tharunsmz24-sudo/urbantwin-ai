# UrbanTwin AI — Security Architecture & Role-Based Access Control (RBAC) Specification
## SaaS Platform Security, Authentication & Multi-Tenant Isolation
**Target Geography:** Tamil Nadu, India | **Platform Version:** v2.5 Enterprise SaaS

---

### 1. Security Architecture Overview

The **UrbanTwin AI** SaaS platform implements defense-in-depth principles across all architectural tiers:
- **Authentication**: Salted **PBKDF2-HMAC-SHA256** key derivation with 100,000 iterations and per-user cryptographic salts.
- **Session Management**: Cryptographically random 192-bit hex tokens stored with HttpOnly, SameSite=Lax attributes and automatic expiration.
- **Tenant Isolation**: Server-enforced query filtering restricting private enterprise facilities and municipal projects by `user_id` and `organization`.
- **Rate Limiting**: Sliding-window rate limiters protecting authentication routes (`/api/auth/login`, `/api/auth/register`) against credential stuffing and brute-force attacks.
- **Audit Logging**: Immutable event logging (`audit_logs`) capturing user IDs, timestamps, client IP addresses, action types, and resource identifiers for regulatory and ESG compliance.

---

### 2. Role-Based Access Control (RBAC) Matrix

| Platform Capability | Public User | Government / Municipal | Industry / Enterprise | Platform Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Public Landing & Platform Overview** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **38 District Baseline Climate Indicators** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **Interactive Map & Leaflet Tile Switcher** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **Heat-Risk Scoring Explanations** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **General Public Heatwave Advisories** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **Run General Intervention Simulator** | ✅ Read | ✅ Read/Simulate | ✅ Read/Simulate | ✅ Full |
| **Municipal Planning Suite** | ❌ Forbidden | ✅ Full Access | ❌ Forbidden | ✅ Full Access |
| **Commission Municipal Projects & Budgets** | ❌ Forbidden | ✅ Create / Read | ❌ Forbidden | ✅ Full Access |
| **District Collector Action Reports** | ❌ Forbidden | ✅ Export | ❌ Forbidden | ✅ Full Access |
| **Enterprise Facility Risk Registry** | ❌ Forbidden | ❌ Forbidden | ✅ Tenant Isolated | ✅ Platform Audit |
| **Register Private Industrial Campuses** | ❌ Forbidden | ❌ Forbidden | ✅ Create / Read | ✅ Platform Audit |
| **Worker Heat-Stress Mitigation Simulator** | ❌ Forbidden | ❌ Forbidden | ✅ Tenant Isolated | ✅ Platform Audit |
| **User Directory & Account Statuses** | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ✅ Full Access |
| **Audit Logs & Security Event Trail** | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ✅ Full Access |

---

### 3. Server-Side Enforcement (Defense Against Frontend Tampering)

Client-side role switching in the UI is provided strictly for seamless pilot demonstrations and evaluation. All backend endpoints enforce strict server-side authentication and role verification via `require_auth(roles=[...])`:

```python
# Server-side verification example:
def require_auth(roles=None):
    user = get_current_user()
    if not user:
        return None, (jsonify({"error": "Authentication required"}), 401)
    if roles and user.get("role") not in roles and user.get("role") != "admin":
        return None, (jsonify({"error": "Access denied"}), 403)
    return user, None
```

Attempting to access `/api/admin/users` or `/api/government/projects` with a public or unauthenticated token immediately returns **HTTP 401 Unauthorized** or **HTTP 403 Forbidden**.

---

### 4. Live Meteorological Data Ingestion Architecture

The data integration layer queries the **Open-Meteo WMO Real-Time Station Grid** with automatic timeout fallbacks:
1. **Live Feed**: Fetches real-time 2-meter air temperature, apparent temperature ("feels like"), humidity, precipitation, and wind speed.
2. **Quality Assurance & Timestamping**: Every observation returns its origin source, observation time, and status tag (`LIVE OBSERVATION` vs `HISTORICAL VERIFIED BENCHMARK`).
3. **Resilience Fallback**: If the external live feed times out or encounters network latency, the platform seamlessly serves calibrated **IMD (1991–2020) climatological normals** and **NASA MODIS thermal scans** without interrupting the user workflow.
