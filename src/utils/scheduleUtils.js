import { SCHEDULE_STATUS } from '../constants/schedule'

/**
 * Get color scheme based on schedule status
 * @param {string} status - The schedule status
 * @returns {object} - Object with bg, text, and border colors
 */
export const getScheduleStatusColors = (status) => {
  switch (status) {
    case SCHEDULE_STATUS.empty:
      return { bg: '#393E46', text: '#EEEEEE70', border: '#EEEEEE20' }
    case SCHEDULE_STATUS.occupied:
      return { bg: 'rgba(16, 185, 129, 0.5)', text: '#34d399', border: '#10b98140' }
    case SCHEDULE_STATUS.maintenance:
      return { bg: 'rgba(245, 158, 11, 0.5)', text: '#fbbf24', border: '#f59e0b40' }
    case SCHEDULE_STATUS.pending:
      return { bg: 'rgba(96, 165, 250, 0.5)', text: '#93c5fd', border: '#60a5fa40' }
    default:
      return { bg: '#393E46', text: '#EEEEEE70', border: '#EEEEEE20' }
  }
}

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

