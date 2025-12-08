import {
  checkFrontendHealth,
  checkSupabaseHealth,
  checkAllServersHealth,
  getServerStatus,
  startServerMonitoring,
  stopServerMonitoring,
  getServerStats,
  displayServerStatus
} from './debugServer'

/**
 * Simplified Debug System - Server Health Monitoring Only
 * All functionality through window.serverDebug namespace
 */

if (typeof window !== 'undefined') {
  // Create the complete serverDebug object
  const serverDebugObject = {
    status: displayServerStatus,
    check: checkAllServersHealth,
    checkFrontend: checkFrontendHealth,
    checkSupabase: checkSupabaseHealth,
    getStatus: getServerStatus,
    startMonitoring: () => startServerMonitoring(30000),
    stopMonitoring: stopServerMonitoring,
    stats: getServerStats,
    help: () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║       📊 SERVER HEALTH DEBUG COMMANDS              ║
╚════════════════════════════════════════════════════╝

STATUS COMMANDS:
  window.serverDebug.status()
    → Display current status of both servers

  window.serverDebug.check()
    → Perform single health check on both

  window.serverDebug.checkFrontend()
    → Check only frontend server

  window.serverDebug.checkSupabase()
    → Check only Supabase server

MONITORING COMMANDS:
  window.serverDebug.startMonitoring()
    → Start continuous monitoring (every 30s)

  window.serverDebug.stopMonitoring()
    → Stop continuous monitoring

STATISTICS:
  window.serverDebug.stats()
    → Display uptime and latency statistics

HELP:
  window.serverDebug.help()
    → Show this help message
      `)
    }
  }

  // Assign to window
  window.serverDebug = serverDebugObject

  // Show help on load in dev mode
  if (import.meta.env.DEV) {
    console.log('🔧 Server Debug Ready! Type: window.serverDebug.help()')
  }
}

export default window.serverDebug || {}
