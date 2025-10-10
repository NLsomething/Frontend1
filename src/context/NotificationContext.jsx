import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

const TYPE_STYLES = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accent: 'bg-emerald-400'
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-700',
    accent: 'bg-rose-400'
  },
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-700',
    accent: 'bg-sky-400'
  }
}

const DEFAULT_DISMISS_MS = 4500

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const addNotification = useCallback((type, title, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const dismissAfter = options.dismissAfter ?? DEFAULT_DISMISS_MS

    setNotifications((prev) => ([
      ...prev,
      {
        id,
        type,
        title,
        description: options.description ?? '',
        dismissAfter
      }
    ]))

    if (dismissAfter !== null) {
      setTimeout(() => removeNotification(id), Math.max(500, dismissAfter))
    }

    return id
  }, [removeNotification])

  const contextValue = useMemo(() => ({
    notifySuccess: (title, options) => addNotification('success', title, options),
    notifyError: (title, options) => addNotification('error', title, options),
    notifyInfo: (title, options) => addNotification('info', title, options),
    dismissNotification: removeNotification
  }), [addNotification, removeNotification])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed top-6 right-6 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {notifications.map(({ id, type, title, description }) => {
          const styles = TYPE_STYLES[type] ?? TYPE_STYLES.info
          return (
            <div
              key={id}
              role="alert"
              className={`pointer-events-auto flex gap-3 border px-4 py-3 shadow-lg transition-all duration-300 ${styles.container}`}
            >
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-sm ${styles.accent}`} aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight">{title}</p>
                {description && (
                  <p className="mt-1 text-xs leading-snug text-slate-600">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeNotification(id)}
                className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-150 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          )
        })}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
