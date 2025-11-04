/**
 * Parse a date string (YYYY-MM-DD) to Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export const parseDateString = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

/**
 * Convert Date object to ISO date string (YYYY-MM-DD)
 * @param {Date} dateObj - Date object
 * @returns {string} ISO date string
 */
export const toIsoDateString = (dateObj) => {
  const local = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
}

/**
 * Format a date string for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date for display
 */
export const formatDateDisplay = (dateString) => {
  return parseDateString(dateString).toLocaleDateString()
}

/**
 * Get the label for a time slot by hour
 * @param {string} slotId - Timeslot identifier
 * @param {Array} timeSlots - Array of time slot objects
 * @returns {string} Time slot label
 */
const sanitizeSlotLabel = (label) => {
  if (!label || typeof label !== 'string') {
    return ''
  }

  const withoutBullet = label.includes('•') ? label.split('•')[0].trim() : label
  return withoutBullet.trim()
}

export const getSlotLabel = (slotId, timeSlots) => {
  if (slotId === undefined || slotId === null) return ''
  const normalized = String(slotId)

  const match = timeSlots.find((slot) => {
    const id = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.timeslot_id
    if (id !== undefined && id !== null && String(id) === normalized) return true
    const order = slot.slot_order ?? slot.slotOrder
    if (order !== undefined && order !== null && String(order) === normalized) return true
    return false
  })

  if (!match) return ''

  const rawLabel =
    match.slot_name ??
    match.slotName ??
    match.label ??
    match.name ??
    match.displayLabel ??
    ''

  return sanitizeSlotLabel(rawLabel)
}

/**
 * Format a request's time range for display
 * @param {object} request - Request object with start_hour and end_hour
 * @param {Array} timeSlots - Array of time slot objects
 * @returns {string} Formatted time range
 */
export const formatRequestRange = (request, timeSlots) => {
  const startId = request.start_timeslot_id || request.start_slot_id || request.start_hour
  const endId = request.end_timeslot_id || request.end_slot_id || request.end_hour

  if (!startId) return ''

  const startLabel = getSlotLabel(startId, timeSlots)
  const endLabel = endId ? getSlotLabel(endId, timeSlots) : ''

  if (!endLabel || startLabel === endLabel) {
    return startLabel
  }

  return `${startLabel} to ${endLabel}`
}

export const getRequestRoomLabel = (request) => {
  if (!request) return ''
  return request.room_name || request.room_number || request.room_code || ''
}

/**
 * Group rooms by section and floor for hierarchical display
 * @param {Array} rooms - Array of room objects with section/floor data
 * @returns {Array} Structured array of sections with floors and rooms
 */
export const groupRoomsByFloor = (rooms) => {
  if (!rooms || rooms.length === 0) return []

  const floors = {}
  rooms.forEach(room => {
    const floorId = room.floors?.id
    const floorName = room.floors?.floor_name || 'Unknown Floor'

    if (!floors[floorId]) {
      floors[floorId] = {
        id: floorId,
        name: floorName,
        rooms: []
      }
    }

    floors[floorId].rooms.push(room)
  })

  return Object.values(floors)
    .map(floor => ({
      ...floor,
      rooms: floor.rooms.sort((a, b) => (a.room_name || '').localeCompare(b.room_name || ''))
    }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

/**
 * Filter historical requests by date range
 * @param {Array} requests - Array of request objects
 * @param {object} dateFilter - Object with startDate and endDate
 * @param {string} excludeStatus - Status to exclude (e.g., 'pending')
 * @returns {Array} Filtered requests
 */
export const filterHistoricalRequests = (requests, dateFilter, excludeStatus = 'pending') => {
  const filtered = requests.filter((request) => request.status !== excludeStatus)
  
  if (dateFilter.startDate || dateFilter.endDate) {
    return filtered.filter((request) => {
      const reviewedDate = request.reviewed_at ? request.reviewed_at.split('T')[0] : request.created_at.split('T')[0]
      
      const afterStart = !dateFilter.startDate || reviewedDate >= dateFilter.startDate
      const beforeEnd = !dateFilter.endDate || reviewedDate <= dateFilter.endDate
      
      return afterStart && beforeEnd
    })
  }
  
  return filtered
}

/**
 * Get default date filter (last 7 days)
 * @returns {object} Date filter object with startDate and endDate
 */
export const getDefaultDateFilter = () => ({
  startDate: (() => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    return toIsoDateString(start)
  })(),
  endDate: (() => {
    const today = new Date()
    return toIsoDateString(today)
  })()
})

