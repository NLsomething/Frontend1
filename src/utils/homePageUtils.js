/**
 * Generate time slots for the schedule grid
 * @returns {Array} Array of time slot objects with label and hour
 */
export const generateTimeSlots = () => {
  return Array.from({ length: 14 }, (_, index) => {
    const hour = 7 + index
    const period = hour < 12 ? 'AM' : 'PM'
    const twelveHour = ((hour + 11) % 12) + 1
    return {
      label: `${twelveHour}:00 ${period}`,
      hour
    }
  })
}

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
 * @param {number} hour - Hour in 24-hour format
 * @param {Array} timeSlots - Array of time slot objects
 * @returns {string} Time slot label
 */
export const getSlotLabel = (hour, timeSlots) => {
  return timeSlots.find((slot) => slot.hour === hour)?.label || ''
}

/**
 * Format a request's time range for display
 * @param {object} request - Request object with start_hour and end_hour
 * @param {Array} timeSlots - Array of time slot objects
 * @returns {string} Formatted time range
 */
export const formatRequestRange = (request, timeSlots) => {
  const start = Math.min(request.start_hour, request.end_hour)
  const end = Math.max(request.start_hour, request.end_hour)
  const startLabel = getSlotLabel(start, timeSlots)
  const endLabel = getSlotLabel(end, timeSlots)
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
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
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})

