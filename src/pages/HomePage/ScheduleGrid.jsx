import { Fragment } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import ScheduleCellTooltip from '../../components/common/ScheduleCellTooltip'

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
  const getStatusStyle = (status) => {
    switch (status) {
      case SCHEDULE_STATUS.empty:
        return 'bg-slate-50/80 text-slate-600 border-slate-200'
      case SCHEDULE_STATUS.occupied:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case SCHEDULE_STATUS.maintenance:
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case SCHEDULE_STATUS.pending:
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-50/80 text-slate-600 border-slate-200'
    }
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: '821px' }}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `82px repeat(${timeSlots.length}, minmax(60px, 1fr))`,
            borderTop: '1px solid #e2e8f0',
            fontSize: '12px'
          }}
        >
          {/* Top-left corner cell */}
          <div className="bg-white font-semibold text-slate-700 border-r border-slate-200" style={{ padding: '10px 14px' }}>
            Room
          </div>
          
          {/* Header row: Time slots */}
          {timeSlots.map((slot) => (
            <div key={`header-${slot.hour}`} className="bg-white text-center font-semibold text-slate-600 border-l border-slate-200" style={{ padding: '10px 7px', fontSize: '10px' }}>
              {slot.label}
            </div>
          ))}
          
          {/* Data rows: One row per room */}
          {rooms.map((room) => (
            <Fragment key={`room-${room}`}>
              {/* Room name cell */}
              <div className="bg-white font-medium text-slate-700 border-t border-r border-slate-200" style={{ padding: '10px 14px' }}>
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
                
                const cellClasses = `border-t border-l text-left transition-colors duration-150 ${getStatusStyle(status)} ${interactive ? 'cursor-pointer hover:bg-slate-200/60' : 'cursor-default'}`
                
                // Use smaller font for maintenance status
                const statusFontSize = status === SCHEDULE_STATUS.maintenance ? '7px' : '9px'

                return (
                  <ScheduleCellTooltip
                    key={key}
                    status={status}
                    room={room}
                    timeSlot={slot.label}
                    entry={entry}
                  >
                    <button
                      type="button"
                      className={cellClasses}
                      style={{ padding: '10px 7px', width: '100%' }}
                      onClick={() => {
                        if (canEdit && onAdminAction) {
                          onAdminAction(room, slot.hour)
                        } else if (canRequest && onTeacherRequest) {
                          onTeacherRequest(room, slot.hour)
                        }
                      }}
                      disabled={!interactive}
                    >
                      <span className="block font-semibold uppercase tracking-wide" style={{ fontSize: statusFontSize }}>
                        {label}
                      </span>
                      {details.length > 0 && (
                        <span className="block space-y-0.5 text-slate-600" style={{ fontSize: '8px', marginTop: '4px' }}>
                          {details.map((line, index) => (
                            <span key={`${key}-detail-${index}`} className="block truncate">
                              {line}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  </ScheduleCellTooltip>
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

