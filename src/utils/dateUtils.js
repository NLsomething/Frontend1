/**
 * Get today's date in local timezone formatted as YYYY-MM-DD
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayLocalDate = () => {
  const today = new Date()
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
}

/**
 * Format a date object to YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDateToISO = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0]
}

