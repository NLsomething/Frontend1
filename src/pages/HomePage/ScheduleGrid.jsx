import { Fragment } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { COLORS } from '../../constants/colors'
import { getScheduleStatusColors } from '../../utils/scheduleUtils'

const ROOM_COLUMN_WIDTH = 90
const CLASSROOM_COLUMN_WIDTH = 50
const DEFAULT_COLUMN_WIDTH = 50

const resolveRoomCode = (room) => {
  if (!room || typeof room === 'string') {
    return room || ''
  }
  return room.room_code || room.roomNumber || room.room_number || room.code || ''
}

const resolveRoomLabel = (room) => {
  if (!room) return ''
  if (typeof room === 'string') return room
  return room.room_name || room.name || room.displayName || room.room_code || room.roomNumber || ''
}

const resolveRoomKey = (room, index) => {
  if (!room) return `room-${index}`
  if (typeof room === 'string') return room
  return room.id || room.room_code || room.roomNumber || `room-${index}`
}

const resolveSlotKey = (slot) => {
  return slot.key ?? slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? slot.label
}

const resolveSlotLabel = (slot) => {
  return slot.label || slot.slot_name || slot.name || resolveSlotKey(slot)
}

const resolveSlotType = (slot) => {
  return (slot.slotType || slot.slot_type || slot.type || '').toLowerCase()
}

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
  const activeSlotType = resolveSlotType(timeSlots?.[0] || {})
  const columnWidth = activeSlotType === 'classroom' ? CLASSROOM_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH
  const roomColumnWidth = ROOM_COLUMN_WIDTH

  return (
    <div className="overflow-x-auto">
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${roomColumnWidth}px repeat(${timeSlots.length}, minmax(${columnWidth}px, 1fr))`,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '12px'
          }}
        >
          {/* Top-left corner cell */}
          <div className="font-semibold border-r" style={{ padding: '10px 14px', backgroundColor: COLORS.darkGray, color: COLORS.white, borderColor: 'rgba(238,238,238,0.2)' }}>
            Room
          </div>
          
          {/* Header row: Time slots */}
          {timeSlots.map((slot) => {
            const slotHeaderKey = resolveSlotKey(slot)
            const headerLabel = resolveSlotLabel(slot)
            return (
              <div key={`header-${slotHeaderKey}`} className="text-center font-semibold border-l" style={{ padding: '10px 7px', fontSize: '10px', backgroundColor: COLORS.darkGray, color: COLORS.white, borderColor: 'rgba(238,238,238,0.2)' }}>
                {headerLabel}
              </div>
            )
          })}
          
          {/* Data rows: One row per room */}
          {rooms.map((room, roomIndex) => {
            const roomKey = resolveRoomKey(room, roomIndex)
            const roomCode = resolveRoomCode(room)
            const roomLabel = resolveRoomLabel(room)
            const roomDisplay = roomLabel || roomCode || '—'

            return (
              <Fragment key={`room-${roomKey}`}>
                {/* Room name cell */}
                <div className="font-medium border-t border-r" style={{ padding: '10px 14px', backgroundColor: COLORS.darkGray, color: COLORS.white, borderColor: 'rgba(238,238,238,0.2)' }}>
                  {roomDisplay}
                </div>
              
                {/* Schedule cells for this room across all time slots */}
                {timeSlots.map((slot) => {
                  const slotKey = resolveSlotKey(slot)
                  const scheduleRoomKey = roomCode || roomKey
                  const scheduleEntryRoomKey = buildKey(scheduleRoomKey, slotKey)
                  const entry = scheduleMap[scheduleEntryRoomKey] || (roomCode ? scheduleMap[buildKey(roomCode, slotKey)] : undefined) || scheduleMap[buildKey(roomKey, slotKey)]
                  const status = entry?.status || SCHEDULE_STATUS.empty
                  const label = SCHEDULE_STATUS_LABELS[status]
                  const details = entry?.course_name || entry?.booked_by ? [entry?.course_name, entry?.booked_by].filter(Boolean) : []
                  const interactive = !!(canEdit || canRequest)

                  const colors = getScheduleStatusColors(status)
                  const statusFontSize = status === SCHEDULE_STATUS.maintenance ? '7px' : '9px'

                  return (
                    <button
                      key={`${roomKey}-${slotKey}`}
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
                          onAdminAction(room, slotKey)
                        } else if (canRequest && onTeacherRequest) {
                          onTeacherRequest(room, slotKey)
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
                            <span key={`${roomKey}-${slotKey}-detail-${index}`} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {line}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ScheduleGrid

