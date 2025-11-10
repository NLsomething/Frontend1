// Small utility to join class names (filters falsy values)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
