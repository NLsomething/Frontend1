import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { SCHEDULE_STATUS } from '../../constants/schedule'

const ScheduleCellTooltip = ({ 
  status,
  room,
  timeSlot,
  entry,
  children 
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef(null)
  const cellRef = useRef(null)

  const handleMouseEnter = useCallback((e) => {
    // Only show tooltip if there's actual content to show
    if (!entry || entry.status === SCHEDULE_STATUS.empty) {
      return
    }

    // Store the element reference
    cellRef.current = e.currentTarget

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set timeout to show tooltip after 500ms
    timeoutRef.current = setTimeout(() => {
      if (!cellRef.current) return
      
      try {
        const rect = cellRef.current.getBoundingClientRect()
        const position = {
          x: rect.right + 10,
          y: rect.top + rect.height / 2
        }
        // Position tooltip to the right of the cell with more padding to avoid overlaying other panels
        setTooltipPosition(position)
        setShowTooltip(true)
      } catch (error) {
        console.error('Error showing tooltip:', error)
      }
    }, 500)
  }, [entry])

  const handleMouseLeave = useCallback(() => {
    // Clear timeout if mouse leaves before tooltip appears
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowTooltip(false)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (showTooltip && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.right + 10,
        y: rect.top + rect.height / 2
      })
    }
  }, [showTooltip])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Get status colors
  const colors = useMemo(() => {
    switch (status) {
      case SCHEDULE_STATUS.occupied:
        return {
          bg: '#d1fae5',
          border: '#10b981',
          text: '#065f46'
        }
      case SCHEDULE_STATUS.maintenance:
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e'
        }
      case SCHEDULE_STATUS.pending:
        return {
          bg: '#dbeafe',
          border: '#3b82f6',
          text: '#1e40af'
        }
      default:
        return {
          bg: '#f1f5f9',
          border: '#cbd5e1',
          text: '#334155'
        }
    }
  }, [status])

  // Clone the children and add mouse event handlers
  const childrenWithProps = useMemo(() => {
    if (!React.isValidElement(children)) {
      return children
    }
    
    return React.cloneElement(children, {
      ...children.props,
      onMouseEnter: (e) => {
        handleMouseEnter(e)
        children.props.onMouseEnter?.(e)
      },
      onMouseLeave: (e) => {
        handleMouseLeave(e)
        children.props.onMouseLeave?.(e)
      },
      onMouseMove: (e) => {
        handleMouseMove(e)
        children.props.onMouseMove?.(e)
      }
    })
  }, [children, handleMouseEnter, handleMouseLeave, handleMouseMove])

  // Don't show tooltip if there's no entry or it's empty
  const hasContent = entry && entry.status !== SCHEDULE_STATUS.empty && (
    entry.course_name || entry.booked_by || entry.reason
  )

  // If no content, just render children without tooltip wrapper
  if (!hasContent) {
    return <>{children}</>
  }

  return (
    <>
      {childrenWithProps}
      
      {showTooltip && (
        <div
          className="fixed z-50 border-2 shadow-xl rounded-lg p-3 pointer-events-auto"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            maxWidth: '300px',
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: '2px',
            transform: 'translateY(-50%)'
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-2">
            <div className="font-bold text-sm uppercase tracking-wide" style={{ color: colors.text }}>
              {status === SCHEDULE_STATUS.occupied && 'Occupied'}
              {status === SCHEDULE_STATUS.maintenance && 'Maintenance'}
              {status === SCHEDULE_STATUS.pending && 'Pending Request'}
            </div>
            
            <div className="text-xs text-slate-600 space-y-1">
              {entry.course_name && (
                <div>
                  <span className="font-semibold">Course:</span>{' '}
                  <span className="select-text">{entry.course_name}</span>
                </div>
              )}
              {entry.booked_by && (
                <div>
                  <span className="font-semibold">Booked by:</span>{' '}
                  <span className="select-text">{entry.booked_by}</span>
                </div>
              )}
              {entry.reason && (
                <div>
                  <span className="font-semibold">Reason:</span>{' '}
                  <span className="select-text">{entry.reason}</span>
                </div>
              )}
              <div>
                <span className="font-semibold">Room:</span> <span className="select-text">{room}</span>
              </div>
              <div>
                <span className="font-semibold">Time:</span> <span className="select-text">{timeSlot}</span>
              </div>
            </div>
          </div>
          
          {/* Tooltip arrow */}
          <div
            className="absolute left-0 top-1/2 -translate-x-full w-0 h-0"
            style={{
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: `8px solid ${colors.border}`
            }}
          />
        </div>
      )}
    </>
  )
}

export default ScheduleCellTooltip

