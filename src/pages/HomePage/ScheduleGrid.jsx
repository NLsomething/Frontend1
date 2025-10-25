import { Fragment } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'

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
      <div className="min-w-[960px]">
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `120px repeat(${timeSlots.length}, minmax(70px, 1fr))`,
            borderTop: '1px solid #e2e8f0',
            fontSize: '14px'
          }}
        >
          {/* Top-left corner cell */}
          <div className="bg-white px-4 py-3 font-semibold text-slate-700 border-r border-slate-200">
            Room
          </div>
          
          {/* Header row: Time slots */}
          {timeSlots.map((slot) => (
            <div key={`header-${slot.hour}`} className="bg-white px-2 py-3 text-center font-semibold text-slate-600 border-l border-slate-200 text-xs">
              {slot.label}
            </div>
          ))}
          
          {/* Data rows: One row per room */}
          {rooms.map((room) => (
            <Fragment key={`room-${room}`}>
              {/* Room name cell */}
              <div className="bg-white px-4 py-3 font-medium text-slate-700 border-t border-r border-slate-200">
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
                
                const cellClasses = `border-t border-l px-2 py-3 text-left transition-colors duration-150 ${getStatusStyle(status)} ${interactive ? 'cursor-pointer hover:bg-slate-200/60' : 'cursor-default'}`

                return (
                  <button
                    type="button"
                    key={key}
                    className={cellClasses}
                    onClick={() => {
                      if (canEdit && onAdminAction) {
                        onAdminAction(room, slot.hour)
                      } else if (canRequest && onTeacherRequest) {
                        onTeacherRequest(room, slot.hour)
                      }
                    }}
                    disabled={!interactive}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wide">
                      {label}
                    </span>
                    {details.length > 0 && (
                      <span className="mt-1 block space-y-0.5 text-xs text-slate-600">
                        {details.map((line, index) => (
                          <span key={`${key}-detail-${index}`} className="block truncate">
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

