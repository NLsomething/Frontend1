import { Fragment, useState, useEffect } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { getScheduleStatusColors, formatTimeSlot } from '../../utils/scheduleUtils'
import ScheduleCellTooltip from '../common/ScheduleCellTooltip'
import { COLORS } from '../../constants/colors'

const SchedulePanel = ({ 
  isOpen,
  roomCode, 
  schedule, 
  scheduleLoading, 
  scheduleDate, 
  onDateChange, 
  canEdit, 
  canRequest, 
  onAdminAction, 
  onTeacherRequest,
  onClose 
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen && roomCode) {
      setMounted(true)
    } else {
      setMounted(false)
    }
  }, [isOpen, roomCode])

  if (!roomCode) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 'clamp(260px, 15%, 300px)',
      width: 'auto',
      minWidth: '140px',
      maxWidth: '160px',
      height: '100vh',
      backgroundColor: '#393E46',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.5)',
      zIndex: 29,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: mounted && isOpen ? 1 : 0,
      transform: mounted && isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      pointerEvents: mounted && isOpen ? 'auto' : 'none'
    }}>
      {/* Schedule Header */}
      <div style={{
        padding: '14px 21px',
        borderBottom: '2px solid rgba(238,238,238,0.1)',
        backgroundColor: '#222831',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '600',
            color: '#EEEEEE',
            margin: 0
          }}>
            Room Schedule
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#EEEEEE',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#3282B8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#EEEEEE'}
          >
            ×
          </button>
        </div>
        
        {/* Date Picker */}
        <div style={{
          marginTop: '8px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: '600',
            color: '#EEEEEE',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Schedule Date
          </label>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid rgba(238,238,238,0.2)',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#EEEEEE',
              backgroundColor: '#393E46',
              boxSizing: 'border-box'
            }}
            className="dark-date-input"
          />
          <style>
            {`
              .dark-date-input::-webkit-calendar-picker-indicator {
                filter: invert(1);
                cursor: pointer;
              }
            `}
          </style>
        </div>
      </div>

      {/* Schedule Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#3282B8 #393E46'
      }}>
        <style>
          {`
          `}
        </style>
        {scheduleLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#EEEEEE80', fontSize: '14px' }}>
            Loading schedule...
          </div>
        ) : (
          <div style={{ 
            fontSize: '12px',
            display: 'grid',
            gridTemplateColumns: '65px 1fr',
            borderTop: '1px solid rgba(238,238,238,0.1)'
          }}>
            {/* Generate time slots */}
            {Array.from({ length: 14 }, (_, index) => {
              const hour = 7 + index
              const timeLabel = formatTimeSlot(hour)
              
              // Find schedule entry for this hour
              const entry = schedule.find(s => s.slot_hour === hour)
              const status = entry?.status || SCHEDULE_STATUS.empty
              const statusLabel = SCHEDULE_STATUS_LABELS[status]
              const courseName = entry?.course_name || ''
              const bookedBy = entry?.booked_by || ''
              
              // Get background color based on status
              const colors = getScheduleStatusColors(status)
              
              // Check if interactive
              const interactive = canEdit || canRequest
              
              const details = status === SCHEDULE_STATUS.pending ? [] : [courseName, bookedBy].filter(Boolean)
              
              // Use smaller font for maintenance status
              const statusFontSize = status === SCHEDULE_STATUS.maintenance ? '7px' : '9px'
              
              // For pending status, show simple "Pending Request" without tooltip
              const buttonContent = (
                <button
                  type="button"
                  onClick={() => {
                    if (canEdit && onAdminAction) {
                      onAdminAction(roomCode, hour)
                    } else if (canRequest && onTeacherRequest) {
                      onTeacherRequest(roomCode, hour)
                    }
                  }}
                  disabled={!interactive}
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    padding: '10px 7px',
                    textAlign: 'left',
                    transition: 'filter 0.15s',
                    cursor: interactive ? 'pointer' : 'default',
                    border: 'none',
                    borderTop: '1px solid rgba(238,238,238,0.1)',
                    borderLeft: '1px solid rgba(238,238,238,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (interactive) {
                      e.currentTarget.style.filter = 'brightness(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (interactive) {
                      e.currentTarget.style.filter = 'none'
                    }
                  }}
                >
                  <span style={{
                    display: 'block',
                    fontSize: statusFontSize,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: colors.text
                  }}>
                    {statusLabel}
                  </span>
                  {details.length > 0 && (
                    <span style={{
                      marginTop: '4px',
                      display: 'block',
                      fontSize: '8px',
                      color: 'rgba(238,238,238,0.7)'
                    }}>
                      {details.map((line, idx) => (
                        <span key={idx} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {line}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              )
              
              return (
                <Fragment key={hour}>
                  {/* Time label cell */}
                  <div style={{
                    backgroundColor: '#393E46',
                    padding: '10px 7px',
                    fontWeight: '500',
                    color: '#EEEEEE',
                    borderTop: '1px solid rgba(238,238,238,0.1)',
                    borderRight: '1px solid rgba(238,238,238,0.1)',
                    fontSize: '10px',
                    textAlign: 'center'
                  }}>
                    {timeLabel}
                  </div>
                  
                  {/* Schedule content cell */}
                  {status === SCHEDULE_STATUS.pending ? buttonContent : (
                    <ScheduleCellTooltip
                      status={status}
                      room={roomCode}
                      timeSlot={timeLabel}
                      entry={entry}
                    >
                      {buttonContent}
                    </ScheduleCellTooltip>
                  )}
                </Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SchedulePanel

