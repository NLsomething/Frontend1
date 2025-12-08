import { supabase } from '../lib/supabaseClient'

/**
 * Server Health Check and Debug Utility
 * Monitors both Supabase (backend) and Frontend servers
 */

let serverHealthInterval = null
let serverHealthHistory = []

/**
 * Check if Frontend server is reachable
 * @returns {Promise<{connected: boolean, latency: number, error: string|null}>}
 */
export const checkFrontendHealth = async () => {
  const startTime = performance.now()
  
  try {
    // Try to fetch a simple resource (index.html or public file)
    await fetch(window.location.origin, {
      method: 'HEAD',
      mode: 'no-cors'
    })
    
    const latency = performance.now() - startTime
    
    return {
      connected: true,
      latency: Math.round(latency),
      error: null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    const latency = performance.now() - startTime
    return {
      connected: false,
      latency: Math.round(latency),
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Check if Supabase server is reachable
 * @returns {Promise<{connected: boolean, latency: number, error: string|null}>}
 */
export const checkSupabaseHealth = async () => {
  const startTime = performance.now()
  
  try {
    // Simple health check - query profiles table
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    const latency = performance.now() - startTime
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is fine
      // Other errors indicate connection problems
      return { 
        connected: false, 
        latency, 
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
    
    return { 
      connected: true, 
      latency: Math.round(latency),
      error: null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    const latency = performance.now() - startTime
    return { 
      connected: false, 
      latency: Math.round(latency),
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Check both frontend and backend health
 * @returns {Promise<object>} Combined health status
 */
export const checkAllServersHealth = async () => {
  const [frontend, supabase] = await Promise.all([
    checkFrontendHealth(),
    checkSupabaseHealth()
  ])
  
  return {
    frontend,
    supabase,
    allOnline: frontend.connected && supabase.connected,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get current server status
 * @returns {Promise<object>} Server status information
 */
export const getServerStatus = async () => {
  const health = await checkAllServersHealth()
  
  return {
    frontend: {
      status: health.frontend.connected ? '🟢 ONLINE' : '🔴 OFFLINE',
      connected: health.frontend.connected,
      latency: `${health.frontend.latency}ms`,
      timestamp: health.frontend.timestamp
    },
    supabase: {
      status: health.supabase.connected ? '🟢 ONLINE' : '🔴 OFFLINE',
      connected: health.supabase.connected,
      latency: `${health.supabase.latency}ms`,
      timestamp: health.supabase.timestamp,
      url: import.meta.env.VITE_SUPABASE_URL || 'Not configured'
    },
    allOnline: health.allOnline,
    history: serverHealthHistory.slice(-10) // Last 10 checks
  }
}

/**
 * Start continuous server health monitoring
 * @param {number} intervalMs - Check interval in milliseconds (default 30s)
 */
export const startServerMonitoring = (intervalMs = 30000) => {
  if (serverHealthInterval) {
    console.log('⚠️ Server monitoring already running')
    return
  }

  console.log(`Starting server health monitoring (every ${intervalMs}ms)`)
  
  // Initial check
  checkAllServersHealth().then(health => {
    serverHealthHistory.push(health)
    const fe = health.frontend.connected ? '✓' : '✗'
    const sb = health.supabase.connected ? '✓' : '✗'
    console.log(`[Health Check] Frontend: ${fe} (${health.frontend.latency}ms) | Supabase: ${sb} (${health.supabase.latency}ms)`)
  })

  // Set up interval
  serverHealthInterval = setInterval(async () => {
    const health = await checkAllServersHealth()
    serverHealthHistory.push(health)
    
    // Keep only last 100 checks
    if (serverHealthHistory.length > 100) {
      serverHealthHistory = serverHealthHistory.slice(-100)
    }
    
    const fe = health.frontend.connected ? '✓' : '✗'
    const sb = health.supabase.connected ? '✓' : '✗'
    console.log(`[Health Check] Frontend: ${fe} (${health.frontend.latency}ms) | Supabase: ${sb} (${health.supabase.latency}ms)`)
  }, intervalMs)
}

/**
 * Stop server health monitoring
 */
export const stopServerMonitoring = () => {
  if (serverHealthInterval) {
    clearInterval(serverHealthInterval)
    serverHealthInterval = null
    console.log('Server health monitoring stopped')
  } else {
    console.log('⚠️ Server monitoring not running')
  }
}

/**
 * Get server monitoring statistics
 * @returns {object} Statistics about server health over time
 */
export const getServerStats = () => {
  if (serverHealthHistory.length === 0) {
    return { message: 'No monitoring data yet. Run startServerMonitoring() first.' }
  }

  const frontendConnected = serverHealthHistory.filter(h => h.frontend.connected).length
  const supabaseConnected = serverHealthHistory.filter(h => h.supabase.connected).length
  
  const frontendLatencies = serverHealthHistory.map(h => h.frontend.latency)
  const supabaseLatencies = serverHealthHistory.map(h => h.supabase.latency)
  
  const avgFrontendLatency = Math.round(frontendLatencies.reduce((a, b) => a + b, 0) / frontendLatencies.length)
  const minFrontendLatency = Math.min(...frontendLatencies)
  const maxFrontendLatency = Math.max(...frontendLatencies)
  
  const avgSupabaseLatency = Math.round(supabaseLatencies.reduce((a, b) => a + b, 0) / supabaseLatencies.length)
  const minSupabaseLatency = Math.min(...supabaseLatencies)
  const maxSupabaseLatency = Math.max(...supabaseLatencies)
  
  const frontendUptime = (frontendConnected / serverHealthHistory.length * 100).toFixed(2)
  const supabaseUptime = (supabaseConnected / serverHealthHistory.length * 100).toFixed(2)

  return {
    totalChecks: serverHealthHistory.length,
    frontend: {
      uptime: `${frontendUptime}%`,
      avgLatency: `${avgFrontendLatency}ms`,
      minLatency: `${minFrontendLatency}ms`,
      maxLatency: `${maxFrontendLatency}ms`
    },
    supabase: {
      uptime: `${supabaseUptime}%`,
      avgLatency: `${avgSupabaseLatency}ms`,
      minLatency: `${minSupabaseLatency}ms`,
      maxLatency: `${maxSupabaseLatency}ms`
    },
    lastCheck: serverHealthHistory[serverHealthHistory.length - 1].timestamp
  }
}

/**
 * Display formatted server status in console
 */
export const displayServerStatus = async () => {
  const status = await getServerStatus()
  
  console.clear()
  console.log('╔════════════════════════════════════════════════════╗')
  console.log('║              SERVER HEALTH CHECK                   ║')
  console.log('╚════════════════════════════════════════════════════╝')
  
  console.log('\n FRONTEND SERVER')
  console.log(`Status:      ${status.frontend.status}`)
  console.log(`Latency:     ${status.frontend.latency}`)
  console.log(`Checked:     ${status.frontend.timestamp}`)
  
  console.log('\n SUPABASE SERVER')
  console.log(`Status:      ${status.supabase.status}`)
  console.log(`Latency:     ${status.supabase.latency}`)
  console.log(`URL:         ${status.supabase.url}`)
  console.log(`Checked:     ${status.supabase.timestamp}`)
  
  console.log('\n' + '─'.repeat(50))
  console.log(`Overall:     ${status.allOnline ? '🟢 ALL SYSTEMS ONLINE' : '🔴 ISSUES DETECTED'}`)
  
  if (status.history.length > 0) {
    console.log(`\nRecent Checks (${status.history.length}):`)
    status.history.forEach((check, i) => {
      const fe = check.frontend.connected ? '✓' : '✗'
      const sb = check.supabase.connected ? '✓' : '✗'
      console.log(`  ${i + 1}. [FE: ${fe} ${check.frontend.latency}ms] [SB: ${sb} ${check.supabase.latency}ms] ${check.timestamp}`)
    })
  }
}

/**
 * Window interface for easy debugging - exported functions only
 * Window assignment happens in debug.js
 */

export default {
  checkFrontendHealth,
  checkSupabaseHealth,
  checkAllServersHealth,
  getServerStatus,
  startServerMonitoring,
  stopServerMonitoring,
  getServerStats,
  displayServerStatus
}
