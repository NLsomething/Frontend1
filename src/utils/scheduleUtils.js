import { SCHEDULE_STATUS } from '../constants/schedule'

/**
 * Get color scheme based on schedule status
 * @param {string} status - The schedule status
 * @returns {object} - Object with bg, text, and border colors
 */
export const getScheduleStatusColors = (status) => {
  switch (status) {
    case SCHEDULE_STATUS.empty:
      return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' }
    case SCHEDULE_STATUS.occupied:
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
    case SCHEDULE_STATUS.maintenance:
      return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
    case SCHEDULE_STATUS.pending:
      return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
    default:
      return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' }
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
export const generateTimeSlots = (startHour = 7, endHour = 20) => {
  const slots = []
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(hour)
  }
  return slots
}

