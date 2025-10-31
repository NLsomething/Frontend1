import { Fragment } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { COLORS } from '../../constants/colors'
import { getScheduleStatusColors } from '../../utils/scheduleUtils'

const ScheduleGrid = ({ 
  rooms, 
  timeSlots, 
  scheduleMap, 
  onAdminAction, 
  onTeacherRequest, 
  buildKey, 
  canEdit, 
  canRequest 
}) => {

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: '821px' }}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `82px repeat(${timeSlots.length}, minmax(60px, 1fr))`,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '12px'
          }}
        >
          {/* Top-left corner cell */}
          <div className="font-semibold border-r" style={{ padding: '10px 14px', backgroundColor: COLORS.darkGray, color: COLORS.white, borderColor: 'rgba(238,238,238,0.2)' }}>
            Room
          </div>
          
          {/* Header row: Time slots */}
          {timeSlots.map((slot) => (
            <div key={`header-${slot.hour}`} className="text-center font-semibold border-l" style={{ padding: '10px 7px', fontSize: '10px', backgroundColor: COLORS.darkGray, color: COLORS.white, borderColor: 'rgba(238,238,238,0.2)' }}>
              {slot.label}
            </div>
          ))}
          
          {/* Data rows: One row per room */}
          {rooms.map((room) => (
            <Fragment key={`room-${room}`}>
              {/* Room name cell */}
              <div className="font-medium border-t border-r" style={{ padding: '10px 14px', backgroundColor: COLORS.darkGray, color: COLORS.white, borderColor: 'rgba(238,238,238,0.2)' }}>
                {room}
              </div>
              
              {/* Schedule cells for this room across all time slots */}
              {timeSlots.map((slot) => {
                const key = buildKey(room, slot.hour)
                const entry = scheduleMap[key]
                const status = entry?.status || SCHEDULE_STATUS.empty
                const label = SCHEDULE_STATUS_LABELS[status]
                const details = entry?.course_name || entry?.booked_by ? [entry?.course_name, entry?.booked_by].filter(Boolean) : []
                const interactive = canEdit || canRequest
                
                // Get colors from scheduleUtils (same as room schedule)
                const colors = getScheduleStatusColors(status)
                
                // Use smaller font for maintenance status
                const statusFontSize = status === SCHEDULE_STATUS.maintenance ? '7px' : '9px'

                return (
                  <button
                    key={key}
                    type="button"
                    className="text-left transition-colors duration-150"
                    style={{ 
                      padding: '10px 7px', 
                      width: '100%',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: 'none',
                      borderTop: '1px solid rgba(238,238,238,0.2)',
                      borderLeft: '1px solid rgba(238,238,238,0.2)',
                      cursor: interactive ? 'pointer' : 'default',
                      transition: 'filter 0.15s'
                    }}
                    onClick={() => {
                      if (canEdit && onAdminAction) {
                        onAdminAction(room, slot.hour)
                      } else if (canRequest && onTeacherRequest) {
                        onTeacherRequest(room, slot.hour)
                      }
                    }}
                    disabled={!interactive}
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
                    <span className="block font-semibold uppercase tracking-wide" style={{ fontSize: statusFontSize, color: colors.text }}>
                      {label}
                    </span>
                    {details.length > 0 && (
                      <span style={{ fontSize: '8px', marginTop: '4px', color: 'rgba(238,238,238,0.7)' }}>
                        {details.map((line, index) => (
                          <span key={`${key}-detail-${index}`} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {line}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScheduleGrid

