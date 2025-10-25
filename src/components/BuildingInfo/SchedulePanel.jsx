import { Fragment } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { getScheduleStatusColors, formatTimeSlot } from '../../utils/scheduleUtils'

const SchedulePanel = ({ 
  isOpen,
  roomCode, 
  roomTitle,
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
  if (!isOpen || !roomCode) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 'clamp(260px, 15%, 300px)',
      width: 'auto',
      minWidth: '140px',
      maxWidth: '160px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
      zIndex: 29,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Schedule Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
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
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            ×
          </button>
        </div>
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '4px 0 8px 0'
        }}>
          {roomTitle}
        </p>
        
        {/* Date Picker */}
        <div style={{
          marginTop: '8px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '600',
            color: '#374151',
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
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#1f2937',
              backgroundColor: 'white',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Schedule Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {scheduleLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Loading schedule...
          </div>
        ) : (
          <div style={{ 
            fontSize: '14px',
            display: 'grid',
            gridTemplateColumns: '70px 1fr',
            borderTop: '1px solid #e2e8f0'
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
              
              const details = [courseName, bookedBy].filter(Boolean)
              
              return (
                <Fragment key={hour}>
                  {/* Time label cell */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '12px 8px',
                    fontWeight: '500',
                    color: '#334155',
                    borderTop: '1px solid #e2e8f0',
                    borderRight: '1px solid #cbd5e1',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    {timeLabel}
                  </div>
                  
                  {/* Schedule content cell */}
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
                      padding: '12px 8px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s',
                      cursor: interactive ? 'pointer' : 'default',
                      border: 'none',
                      borderTop: `1px solid ${colors.border}`,
                      borderLeft: `1px solid ${colors.border}`
                    }}
                    onMouseEnter={(e) => {
                      if (interactive) {
                        e.currentTarget.style.backgroundColor = '#cbd5e180'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (interactive) {
                        e.currentTarget.style.backgroundColor = colors.bg
                      }
                    }}
                  >
                    <span style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px'
                    }}>
                      {statusLabel}
                    </span>
                    {details.length > 0 && (
                      <span style={{
                        marginTop: '4px',
                        display: 'block',
                        fontSize: '12px',
                        color: '#475569'
                      }}>
                        {details.map((line, idx) => (
                          <span key={idx} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {line}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
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

