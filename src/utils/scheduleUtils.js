/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @returns {string} - Formatted time string (e.g., "9:00 AM")
 */
export const formatTimeSlot = (hour) => {
  const period = hour < 12 ? 'AM' : 'PM'
  const twelveHour = ((hour + 11) % 12) + 1
  return `${twelveHour}:00 ${period}`
}

/**
 * Generate time slots for a day
 * @param {number} startHour - Starting hour (default: 7)
 * @param {number} endHour - Ending hour (default: 20)
 * @returns {Array} - Array of hour numbers
 */
// Renamed to avoid conflict with homePageUtils.generateTimeSlots
export const generateHourSlots = (startHour = 7, endHour = 20) => {
  const slots = []
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(hour)
  }
  return slots
}

