import { Fragment, useState, useEffect } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { getScheduleStatusColors, formatTimeSlot } from '../../utils/scheduleUtils'
import { COLORS } from '../../constants/colors'

const SchedulePanel = ({ 
  isOpen,
  roomCode, 
  roomName,
  bookable = true,
  schedule, 
  scheduleLoading, 
  scheduleDate, 
  onDateChange, 
  canEdit, 
  canRequest, 
  onAdminAction, 
  onTeacherRequest,
  onClose,
  embedded = false
}) => {
  const [mounted, setMounted] = useState(false)
  // Helpers for formatting
  const isoToDDMMYYYY = (iso) => {
    if (!iso) return ''
    const parts = String(iso).split('-')
    if (parts.length !== 3) return ''
    const [y, m, d] = parts
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  const getTodayDDMMYYYY = () => {
    const t = new Date()
    const dd = String(t.getDate()).padStart(2, '0')
    const mm = String(t.getMonth() + 1).padStart(2, '0')
    const yyyy = String(t.getFullYear())
    return `${dd}/${mm}/${yyyy}`
  }

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
      position: embedded ? 'relative' : 'fixed',
      top: embedded ? 'auto' : 0,
      left: embedded ? 'auto' : 'clamp(260px, 15%, 300px)',
      width: embedded ? '100%' : 'auto',
      minWidth: embedded ? '140px' : '140px',
      maxWidth: embedded ? '160px' : '160px',
      height: embedded ? '100%' : '100vh',
      backgroundColor: embedded ? 'transparent' : '#393E46',
      boxShadow: embedded ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.5)',
      zIndex: embedded ? 1 : 29,
      display: 'flex',
      flexDirection: 'column',
      overflow: embedded ? 'visible' : 'hidden',
      opacity: embedded ? 1 : (mounted && isOpen ? 1 : 0),
      transform: embedded ? 'none' : (mounted && isOpen ? 'translateX(0)' : 'translateX(-100%)'),
      transition: embedded ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out',
      pointerEvents: embedded ? 'auto' : (mounted && isOpen ? 'auto' : 'none')
    }}>
      {/* Schedule Header */}
      <div style={{
        padding: embedded ? '12px 16px' : '14px 21px',
        borderBottom: '2px solid rgba(238,238,238,0.1)',
        backgroundColor: embedded ? COLORS.black : '#222831',
        flexShrink: 0
      }}>
        <div>
          <h3 style={{
            fontSize: embedded ? '14px' : '15px',
            fontWeight: '600',
            color: '#EEEEEE',
            margin: 0
          }}>
            {`Room ${roomName || roomCode}`}
          </h3>
        </div>
        
        {/* Secondary line: Room code */}
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#EEEEEECC', letterSpacing: '0.5px' }}>
          Room code: {roomCode}
        </div>

        {/* Date Picker (no label) - native with icon; emits dd/mm/yyyy */}
        <div style={{ marginTop: '8px' }}>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => {
              const v = e.target.value // yyyy-mm-dd or ''
              if (!v) {
                onDateChange(getTodayDDMMYYYY())
                return
              }
              const [y, m, d] = v.split('-')
              onDateChange(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`)
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid rgba(238,238,238,0.2)',
              borderRadius: '0',
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
      <div 
        className="room-schedule-scrollable"
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3282B8 #393E46',
          backgroundColor: embedded && !bookable ? 'transparent' : (embedded ? COLORS.black : '#393E46')
        }}
      >
        <style>
          {`
            .room-schedule-scrollable::-webkit-scrollbar {
              width: 8px;
            }
            .room-schedule-scrollable::-webkit-scrollbar-track {
              background: ${embedded ? COLORS.black : '#393E46'};
            }
            .room-schedule-scrollable::-webkit-scrollbar-thumb {
              background: #3282B8;
              border-radius: 0px;
            }
            .room-schedule-scrollable::-webkit-scrollbar-thumb:hover {
              background: #3a94c4;
            }
          `}
        </style>
        {!bookable ? (
          <div style={{ 
            padding: '20px', 
            paddingTop: '40px',
            textAlign: 'center', 
            color: '#EEEEEE80', 
            fontSize: '14px',
            backgroundColor: embedded ? 'transparent' : '#393E46',
            minHeight: embedded ? 'calc(100% - 80px)' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239,68,68,0.12)', color: '#fecaca', borderBottom: '1px solid rgba(239,68,68,0.25)', fontSize: '11px', display: 'inline-block' }}>
              This room cannot be booked.
            </div>
          </div>
        ) : scheduleLoading ? (
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
              const interactive = bookable && (canEdit || canRequest)
              
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
                    cursor: interactive ? 'pointer' : 'not-allowed',
                    border: 'none',
                    borderTop: '1px solid rgba(238,238,238,0.1)',
                    borderLeft: '1px solid rgba(238,238,238,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (interactive || status === SCHEDULE_STATUS.occupied) {
                      e.currentTarget.style.filter = 'brightness(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (interactive || status === SCHEDULE_STATUS.occupied) {
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
                    {bookable ? statusLabel : 'Unavailable'}
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
                  {buttonContent}
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

