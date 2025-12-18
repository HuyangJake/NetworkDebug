# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NetworkDebug is a full-stack web application providing network debugging tools including port scanning, DNS resolution, ping, MTR, and HTTP/HTTPS testing. The application has comprehensive IPv4 and IPv6 support and features automatic diagnostics for connection failures.

**Tech Stack:**
- Frontend: React 18 with Material-UI, React Router
- Backend: Express.js (Node.js) with native modules (net, dns, child_process)
- Deployment: Docker multi-stage builds, optimized for Fly.io

## Common Commands

### Development
```bash
# Install all dependencies (root, frontend, and backend)
npm run install-all

# Run both frontend and backend in dev mode (recommended)
npm run dev

# Run backend only (port 3001)
npm run server

# Run frontend only (port 3000)
npm run client
```

### Testing
```bash
# Frontend tests (if available)
cd frontend && npm test
```

### Building & Deployment
```bash
# Build frontend for production
cd frontend && npm run build

# Build Docker image
docker build -t network-debug .

# Run Docker container locally
docker run -p 3001:3001 network-debug

# Deploy to Fly.io
flyctl deploy

# View deployment logs
flyctl logs

# Check deployment status
flyctl status
```

## Architecture

### Monorepo Structure
The project uses a monorepo structure with separate frontend and backend directories, orchestrated by a root package.json using `concurrently` for parallel development.

```
NetworkDebug/
├── backend/          # Express API server
│   └── server.js     # Single-file server with all API endpoints
├── frontend/         # React SPA
│   └── src/
│       ├── pages/    # Page components (one per tool)
│       ├── components/  # Shared components (Layout only)
│       └── App.js    # Router configuration
└── package.json      # Root orchestrator
```

### Frontend Architecture

**Routing Pattern:** The frontend uses React Router with a Layout wrapper that provides consistent navigation across all pages. Each tool has its own dedicated page component.

**Routes:**
- `/` - Home page with public IP detection
- `/port-scan` - Port scanning tool
- `/dns-resolve` - DNS resolution tool
- `/ping` - Ping testing tool
- `/mtr` - MTR diagnostics tool
- `/http-test` - HTTP/HTTPS testing tool

**State Management:** Each page manages its own state using React hooks (useState, useEffect). There is no global state management library - state is isolated per tool.

**API Communication:** All API calls use Axios with proxy configuration in development (`frontend/package.json` proxies to `http://localhost:3001`).

**History Feature:** Each tool implements localStorage-based input history to save the last 20 successful inputs. History keys are per-tool (e.g., `portScanHistory`, `dnsResolveHistory`) to keep them independent.

### Backend Architecture

**Single-File Server:** All API logic resides in `backend/server.js` (~800 lines). This is intentional for simplicity given the application's scope.

**Key Architectural Patterns:**

1. **Native Module Usage:** The backend relies heavily on Node.js native modules:
   - `net` for TCP port scanning
   - `dns` with promisify for DNS resolution
   - `child_process.exec` for system commands (ping, ping6, mtr)
   - `http`/`https` for external API calls and HTTP testing

2. **IPv6 Detection Logic:** Multiple endpoints automatically detect IPv6 vs IPv4:
   - Check if input contains `:` (IPv6 address format)
   - Perform DNS lookup and check for AAAA records
   - Use appropriate command: `ping` vs `ping6`, `ping -6` on Windows

3. **Retry Mechanism:** Public IP detection uses a multi-service, multi-retry pattern:
   - Primary services list (e.g., api.ipify.org, ifconfig.me)
   - Each service retried up to 3 times with 1-second delays
   - 15-second timeout per request
   - Validation functions ensure correct IP format (isValidIPv4, isValidIPv6)

4. **Auto-Diagnosis System:** The `/api/http-test` endpoint optionally performs automatic failure diagnosis:
   - Step 1: DNS resolution check
   - Step 2: Network connectivity (ping)
   - Step 3: Port scanning
   - Returns structured analysis and recommendations

5. **Static File Serving:** In production, the backend serves the frontend build from `./public` directory. This enables single-port deployment.

### Deployment Architecture

**Multi-Stage Docker Build:**
1. Builder stage: Installs and builds frontend
2. Runtime stage: Copies backend code and frontend build artifacts, installs production dependencies only
3. System dependencies: mtr-tiny and iputils-ping installed in both stages

**Environment Requirements:**
- System must have `ping`, `ping6` (or `ping -6`), and `mtr` commands available
- IPv6 support recommended for full functionality
- Port 3001 exposed (configurable via PORT env var)

**Platform-Specific Notes:**
- **Fly.io (recommended):** Provides automatic IPv6, system command support, and edge deployment
- **Railway:** Requires manual port configuration, limited system command support
- **Local Docker:** Works well for testing; ensure host supports IPv6 if testing IPv6 features

## Development Patterns

### Adding a New Tool

1. **Create frontend page** in `frontend/src/pages/NewTool.js`:
   - Import Material-UI components for consistent styling
   - Implement localStorage history management if needed (copy pattern from existing pages)
   - Use Axios for API calls to `/api/new-tool`
   - Handle loading, success, and error states

2. **Add backend endpoint** in `backend/server.js`:
   - Use `app.post('/api/new-tool', async (req, res) => { ... })`
   - Validate input parameters
   - Use try-catch for error handling
   - Return consistent JSON structure: `{ success, data, error, timestamp }`

3. **Update routing** in `frontend/src/App.js`:
   - Add route: `<Route path="/new-tool" element={<NewTool />} />`

4. **Update navigation** in `frontend/src/components/Layout.js`:
   - Add nav item to `navItems` array

### System Command Execution Pattern

When adding functionality that requires system commands:

```javascript
const { exec } = require('child_process');

exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
  if (error) {
    // Check if stdout has content despite error (common with ping6)
    if (stdout && stdout.trim().length > 0) {
      return res.json({ success: true, output: stdout });
    }
    return res.status(500).json({ error: error.message, output: stderr || stdout });
  }
  res.json({ success: true, output: stdout });
});
```

**Important:** Always handle platform differences (Windows vs Unix) when using system commands.

### IPv6 Support Pattern

To add IPv6 support to a new feature:

```javascript
// 1. Detect IPv6 address or domain
const isIPv6Address = host.includes(':');
const lookup = promisify(dns.lookup);
const addresses = await lookup(host, { all: true });
const hasIPv6Record = addresses.some(addr => addr.family === 6);
const useIPv6 = isIPv6Address || hasIPv6Record;

// 2. Use appropriate command
const isWindows = process.platform === 'win32';
let command;
if (isWindows) {
  command = useIPv6 ? `tool -6 ${host}` : `tool ${host}`;
} else {
  command = useIPv6 ? `tool6 ${host}` : `tool ${host}`;
}
```

### Testing Network Features

Since this application relies on real network operations:
- Test with known hosts (e.g., 8.8.8.8, google.com, localhost)
- Test both IPv4 and IPv6 scenarios
- Test timeout and error conditions
- Test with unreachable hosts to verify error handling
- Use Docker to simulate deployment environment

## Important Constraints

### Backend Limitations
- Single-file server means no route modularization - keep endpoint definitions clear with comments
- No middleware beyond CORS and JSON parsing - add validation within each endpoint
- System commands require host support (ping, mtr) - gracefully handle missing tools with error messages

### Frontend Patterns
- No global state management - avoid dependencies between tool pages
- MUI components only - maintain consistent styling by using the existing MUI theme
- Each page is self-contained - duplicating logic is acceptable to maintain independence

### Deployment Considerations
- Backend serves static frontend files in production - any build changes require rebuilding the Docker image
- System commands may behave differently across platforms - always test platform-specific code paths
- IPv6 support depends on deployment environment - provide clear error messages when IPv6 is unavailable

## Configuration Files

- `fly.toml`: Fly.io deployment config (app name, region, port)
- `Dockerfile`: Multi-stage build with network tools
- `frontend/package.json`: Dev server proxies to backend on port 3001
- `.dockerignore` / `.gitignore`: Exclude node_modules and build artifacts
