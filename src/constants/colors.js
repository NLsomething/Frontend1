/**
 * Color palette constants for the application
 */
export const COLORS = {
  // Primary colors
  black: '#222831',
  darkGray: '#393E46',
  darkBlue: '#0F4C75',
  blue: '#3282B8',
  white: '#EEEEEE',
  
  // Additional colors (derived or commonly used)
  whiteTransparent: 'rgba(238,238,238,0.8)',
  whiteTransparentMid: 'rgba(238,238,238,0.7)',
  whiteTransparentLow: 'rgba(238,238,238,0.5)',
  whiteTransparentVeryLow: 'rgba(238,238,238,0.3)',
  whiteTransparentMinimal: 'rgba(238,238,238,0.1)',
  whiteTransparentBorder: 'rgba(238,238,238,0.2)',
  
  // Background colors
  screenBackground: '#1a1a1a',
  panelBackground: '#2a2a2a',
  
  // Scrollbar colors
  scrollbarTrack: '#393E46',
  scrollbarThumb: '#3282B8',
  scrollbarThumbHover: '#0F4C75',
}

/**
 * Get RGBA version of a hex color
 * @param {string} hex - Hex color code
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} - RGBA color string
 */
export const hexToRgba = (hex, opacity = 1) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Get RGB version of a hex color
 * @param {string} hex - Hex color code
 * @returns {string} - RGB color string
 */
export const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${r}, ${g}, ${b})`
}

