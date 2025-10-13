// Shared style classes for consistent UI across the application

export const colors = {
  // Primary colors
  darkBlue: '#1f5ca9',
  darkBlueHover: '#1a4d8f',
  lightBlue: '#096ecc',
  lightBlueHover: '#0859a8',
  lighterBlue: '#e8f4ff',
  lighterBlueHover: '#d0e8ff',
  
  // Neutral colors
  white: '#ffffff',
  lightGray: '#f9f9f9',
  
  // Semantic colors
  success: '#10b981',
  successHover: '#059669',
  error: '#ef4444',
  errorHover: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Slate palette (for text and borders)
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
}

// Button styles
export const buttons = {
  // Base button
  base: 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  
  // Sizes
  sm: 'py-2 px-4 text-sm',
  md: 'py-2.5 px-5 text-base',
  lg: 'py-3 px-6 text-base',
  
  // Variants
  primary: 'bg-[#1f5ca9] hover:bg-[#1a4d8f] text-white shadow-lg hover:scale-105 focus:ring-[#1f5ca9]',
  secondary: 'bg-[#096ecc] hover:bg-[#0859a8] text-white focus:ring-[#096ecc]',
  tertiary: 'bg-[#e8f4ff] hover:bg-[#d0e8ff] text-[#1f5ca9] focus:ring-[#096ecc]',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow focus:ring-emerald-500',
  danger: 'border border-rose-400 hover:bg-rose-50 text-rose-500 focus:ring-rose-400',
  ghost: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
  outline: 'border border-slate-300 hover:bg-slate-100 text-slate-600 focus:ring-slate-400',
  text: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-400',
  
  // Full width
  fullWidth: 'w-full',
  
  // Disabled state
  disabled: 'opacity-60 cursor-not-allowed hover:scale-100',
}

// Input styles
export const inputs = {
  base: 'w-full border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-200',
  default: 'p-2.5',
  compact: 'p-2',
  
  // Focus colors
  focusPrimary: 'focus:ring-[#1f5ca9]',
  focusSecondary: 'focus:ring-[#096ecc]',
  
  // States
  error: 'border-red-500 focus:ring-red-500',
  success: 'border-green-500 focus:ring-green-500',
  disabled: 'bg-gray-100 cursor-not-allowed',
}

// Label styles
export const labels = {
  base: 'block font-medium text-gray-700',
  default: 'text-sm mb-1.5',
  compact: 'text-sm mb-0.5',
  required: 'after:content-["*"] after:ml-0.5 after:text-red-500',
}

// Card/Container styles
export const containers = {
  card: 'rounded-xl shadow-2xl bg-white',
  cardDefault: 'p-7',
  cardCompact: 'p-6',
  cardTight: 'p-4',
  
  // Modal/Dialog
  modal: 'rounded-xl shadow-2xl bg-white transform scale-100 transition-all duration-300',
  modalDefault: 'pt-6 px-6 pb-7 w-full max-w-[25rem]',
  modalCompact: 'pt-3.5 px-5 pb-4.5 w-full max-w-[25rem] max-h-[96vh] overflow-y-auto',
  modalWide: 'pt-6 px-6 pb-7 w-full max-w-3xl',
  modalExtraWide: 'pt-6 px-6 pb-7 w-full max-w-4xl',
  
  // Overlay/Backdrop
  overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50',
  overlayLight: 'absolute inset-0 bg-black/10 z-30',
  
  // Panels/Sidebars
  panel: 'absolute top-0 h-full w-full transition-transform duration-300 ease-in-out bg-white/95 backdrop-blur-sm shadow-2xl',
  panelLeft: 'left-0 border-r border-slate-200',
  panelRight: 'right-0 border-l border-slate-200',
  panelSlideLeft: 'translate-x-0',
  panelSlideLeftHidden: '-translate-x-full',
  panelSlideRight: 'translate-x-0',
  panelSlideRightHidden: 'translate-x-full',
  
  // Panel sizing
  panelSmall: 'max-w-md',
  panelMedium: 'max-w-3xl',
  panelLarge: 'max-w-4xl',
  panelExtraLarge: 'max-w-5xl',
}

// Typography styles
export const typography = {
  h1: 'text-2xl font-bold',
  h2: 'text-xl font-bold',
  h3: 'text-lg font-semibold',
  h4: 'text-base font-semibold',
  
  body: 'text-base',
  bodySmall: 'text-sm',
  bodyTiny: 'text-xs',
  
  subtitle: 'text-gray-600',
  caption: 'text-slate-500',
  muted: 'text-slate-400',
  
  // Text colors
  primary: 'text-[#1f5ca9]',
  secondary: 'text-[#096ecc]',
  success: 'text-emerald-600',
  error: 'text-rose-600',
  warning: 'text-amber-600',
}

// Spacing utilities
export const spacing = {
  form: 'space-y-5',
  formCompact: 'space-y-2',
  formTight: 'space-y-3',
  
  section: 'space-y-6',
  sectionCompact: 'space-y-4',
  
  buttonGroup: 'space-y-2.5',
  buttonGroupTight: 'space-y-2',
}

// Header styles
export const headers = {
  container: 'text-center',
  containerDefault: 'mb-7',
  containerCompact: 'mb-2.5',
  containerTight: 'mb-4',
}

// Status badge styles
export const badges = {
  base: 'inline-flex items-center px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide border',
  
  // Status colors
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  error: 'bg-rose-50 text-rose-600 border-rose-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  info: 'bg-blue-50 text-blue-600 border-blue-200',
  pending: 'bg-blue-50 text-blue-600 border-blue-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
}

// Utility functions for combining classes
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Helper to create button classes
export function createButton(variant = 'primary', size = 'md', fullWidth = false, disabled = false) {
  return cn(
    buttons.base,
    buttons[size],
    buttons[variant],
    fullWidth && buttons.fullWidth,
    disabled && buttons.disabled
  )
}

// Helper to create input classes
export function createInput(compact = false, state = null, focus = 'focusPrimary') {
  return cn(
    inputs.base,
    compact ? inputs.compact : inputs.default,
    inputs[focus],
    state && inputs[state]
  )
}

// Helper to create container classes
export function createContainer(type = 'card', size = 'cardDefault') {
  return cn(
    containers[type],
    containers[size]
  )
}

// Helper to create panel classes
export function createPanel(side = 'left', size = 'panelMedium', isOpen = true) {
  const baseClasses = [
    containers.panel,
    containers[size]
  ]
  
  if (side === 'left') {
    baseClasses.push(containers.panelLeft)
    baseClasses.push(isOpen ? containers.panelSlideLeft : containers.panelSlideLeftHidden)
  } else {
    baseClasses.push(containers.panelRight)
    baseClasses.push(isOpen ? containers.panelSlideRight : containers.panelSlideRightHidden)
  }
  
  return cn(...baseClasses)
}

// Styles
export const authPages = {
  screen: 'w-screen h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center',
  screenWithScroll: 'w-screen h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center py-6',
  container: 'w-full max-w-[26rem] mx-4',
  containerCompact: 'w-full max-w-[24rem] mx-4',
  icon: 'mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3',
  iconCompact: 'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2',
  iconBg: 'bg-[#e8f4ff]',
  errorAlert: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4',
  buttonGroup: 'mt-5 space-y-2.5',
  buttonGroupCompact: 'mt-4 space-y-2',
  formCompact: 'space-y-3',
  headerCompact: 'text-center mb-4',
  titleCompact: 'text-2xl mb-1',
  subtitleCompact: 'text-sm',
  labelCompact: 'text-xs font-medium mb-1',
  inputCompact: 'w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
}
