# Server Debug Utility Guide

## Overview
The debug system now includes comprehensive server health checking and monitoring capabilities. You can check if the Supabase server is online, monitor connection latency, and view statistics.

## Quick Start

Open the browser console and type:

### Check Server Status (One-time)
```javascript
window.debug.status()
// Shows: Online/Offline, Latency, Timestamp, Recent checks
```

### Start Continuous Monitoring
```javascript
window.debug.startMonitoring()
// Checks server health every 30 seconds
// Logs results to console automatically
```

### Stop Monitoring
```javascript
window.debug.stopMonitoring()
// Stops the periodic health checks
```

### View Statistics
```javascript
window.debug.stats()
// Shows: Total checks, uptime %, avg/min/max latency
```

### Get All Commands
```javascript
window.debug.help()
// Displays all available debug commands
```

## Available Commands

### Server Health Commands
| Command | Description |
|---------|-------------|
| `window.debug.status()` | Display current server status |
| `window.debug.check()` | Perform single health check |
| `window.debug.startMonitoring()` | Start continuous monitoring (every 30s) |
| `window.debug.stopMonitoring()` | Stop monitoring |
| `window.debug.stats()` | Show uptime, latency statistics |

### Logging Commands
| Command | Description |
|---------|-------------|
| `window.debug.enable('app:*')` | Enable all debug logs |
| `window.debug.enable('app:auth')` | Enable only auth logs |
| `window.debug.disable()` | Disable all debug logs |
| `window.debug.getStatus()` | Show current logging status |

## Usage Examples

### Example 1: Quick Health Check
```javascript
> window.debug.status()

╔════════════════════════════════════════╗
║     🔍 SERVER HEALTH CHECK              ║
╚════════════════════════════════════════╝
Status:      🟢 ONLINE
Latency:     145ms
Timestamp:   2025-12-07T10:30:45.123Z
Server:      https://pdysqmptcoxqnadumoff.supabase.co
─────────────────────────────────────────
Recent Checks (5):
  1. ✓ 2025-12-07T10:30:45.123Z (145ms)
  2. ✓ 2025-12-07T10:30:40.456Z (152ms)
  3. ✓ 2025-12-07T10:30:35.789Z (148ms)
  4. ✓ 2025-12-07T10:30:30.012Z (156ms)
  5. ✓ 2025-12-07T10:30:25.345Z (150ms)
```

### Example 2: Monitor Server for 5 minutes
```javascript
// Start monitoring
> window.debug.startMonitoring()
🚀 Starting server health monitoring (every 30000ms)

// Wait 5 minutes... see logs in console

// View statistics
> window.debug.stats()
{
  totalChecks: 10,
  connected: 10,
  disconnected: 0,
  uptime: "100.00%",
  avgLatency: "148ms",
  minLatency: "142ms",
  maxLatency: "165ms",
  lastCheck: "2025-12-07T10:35:45.678Z"
}

// Stop monitoring
> window.debug.stopMonitoring()
⏹️ Server health monitoring stopped
```

### Example 3: Enable Auth Logging + Monitor Server
```javascript
// Enable logging for auth operations
> window.debug.enable('app:auth')
✓ Debug enabled for: app:auth

// Start server monitoring
> window.debug.startMonitoring()
🚀 Starting server health monitoring (every 30000ms)

// Now you'll see both:
// - Auth debug logs as they happen
// - Server health checks every 30 seconds
```

## Console Output Examples

### Server Online
```
[Health Check] ✓ Connected (145ms)
```

### Server Offline
```
[Health Check] ✗ Disconnected (5000ms)
```

## Features

✅ **Real-time Health Checks** - Checks Supabase connection status
✅ **Latency Monitoring** - Measures response time in milliseconds
✅ **Continuous Monitoring** - Optional background health checks
✅ **Statistics** - Tracks uptime, min/max/avg latency
✅ **History** - Keeps last 100 checks for review
✅ **Combined Debugging** - Works alongside existing app debug logs
✅ **Browser Console Only** - No UI components, all in console

## How It Works

The health check works by attempting a simple database query to the profiles table. If the query succeeds (or fails with expected error), the server is online. Connection latency is measured using `performance.now()`.

### Latency Interpretation
- **< 100ms** - Excellent
- **100-200ms** - Good
- **200-500ms** - Acceptable
- **> 500ms** - Slow (check network)

## Related Files
- Implementation: `src/utils/debugServer.js`
- Integration: `src/utils/debug.js`
